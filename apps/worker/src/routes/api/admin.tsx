import type { MiddlewareHandler } from 'hono';
import {
  apiError,
  apiSuccess,
  categoryInputSchema,
  pageInputSchema,
  paginationSchema,
  settingInputSchema,
  userInputSchema,
} from '@fauna/shared';
import type { AppEnv } from '../../index';
import { requireActor, requireAdmin } from '../../middleware/auth';
import { savePost } from '../../services/posts';
import { listUsers } from '../../repositories/users';
import { renderMarkdown } from '../../utils/content';
import { Layout, Markdown } from '../../views/layout';

const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
};
async function categoryCreatesCycle(
  db: D1Database,
  id: string | undefined,
  parentId: string | null,
) {
  if (!parentId) return false;
  if (id && id === parentId) return true;
  const result = await db
    .prepare(
      `WITH RECURSIVE ancestors(id) AS (
        SELECT ? UNION ALL SELECT c.parent_id FROM categories c JOIN ancestors a ON c.id=a.id WHERE c.parent_id IS NOT NULL
      ) SELECT 1 FROM ancestors WHERE id=? LIMIT 1`,
    )
    .bind(parentId, id ?? '')
    .first();
  return Boolean(result);
}

export function registerAdminRoutes(app: import('hono').Hono<AppEnv>) {
  app.use('/api/admin/*', noStore, requireActor);
  app.get('/api/admin/session', (c) => c.json(apiSuccess(c.get('actor'))));
  app.get('/api/admin/dashboard', async (c) => {
    const r = await c.env.DB.batch([
      c.env.DB.prepare('SELECT status,count(*) count FROM posts GROUP BY status'),
      c.env.DB.prepare('SELECT count(*) count FROM pages'),
      c.env.DB.prepare('SELECT count(*) count FROM categories'),
      c.env.DB.prepare('SELECT count(*) count,coalesce(sum(size_bytes),0) bytes FROM media'),
    ]);
    return c.json(
      apiSuccess({
        posts: r[0]!.results,
        pages: r[1]!.results[0],
        categories: r[2]!.results[0],
        media: r[3]!.results[0],
      }),
    );
  });
  app.get('/api/admin/posts', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    const where = search ? 'WHERE title_uk LIKE ? OR title_en LIKE ?' : '';
    const args = search ? [`%${search}%`, `%${search}%`] : [];
    const r = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT id,slug,title_uk,title_en,status,is_en_published,updated_at FROM posts ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      ).bind(...args, p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare(`SELECT count(*) count FROM posts ${where}`).bind(...args),
    ]);
    return c.json(
      apiSuccess({
        items: r[0]!.results,
        total: (r[1]!.results[0] as { count: number }).count,
        page: p.page,
        pageSize: p.pageSize,
      }),
    );
  });
  app.get('/api/admin/posts/:id/preview', async (c) => {
    const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id=?')
      .bind(c.req.param('id'))
      .first<Record<string, unknown>>();
    if (!post) return c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
    const locale = c.req.query('locale') === 'en' && post.title_en && post.body_md_en ? 'en' : 'uk';
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={`Preview: ${String(post[locale === 'en' ? 'title_en' : 'title_uk'])}`}
        robots="noindex,nofollow"
      >
        <article>
          <p>Preview — не публічна сторінка</p>
          <h1>{String(post[locale === 'en' ? 'title_en' : 'title_uk'])}</h1>
          <Markdown
            html={renderMarkdown(String(post[locale === 'en' ? 'body_md_en' : 'body_md_uk']))}
          />
        </article>
      </Layout>,
    );
  });
  app.get('/api/admin/posts/:id', async (c) => {
    const row = await c.env.DB.prepare('SELECT * FROM posts WHERE id=?')
      .bind(c.req.param('id'))
      .first<Record<string, unknown>>();
    if (!row) return c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
    const relations = await c.env.DB.batch([
      c.env.DB.prepare('SELECT media_id FROM post_media WHERE post_id=? ORDER BY position').bind(
        c.req.param('id'),
      ),
      c.env.DB.prepare('SELECT category_id FROM post_categories WHERE post_id=?').bind(
        c.req.param('id'),
      ),
    ]);
    return c.json(
      apiSuccess({
        ...row,
        mediaIds: (relations[0]!.results as Array<{ media_id: string }>).map(
          (relation) => relation.media_id,
        ),
        categoryIds: (relations[1]!.results as Array<{ category_id: string }>).map(
          (relation) => relation.category_id,
        ),
      }),
    );
  });
  app.post('/api/admin/posts', async (c) => {
    const saved = await savePost(c.env, c.get('actor'), undefined, await c.req.json());
    if (saved.kind === 'invalid')
      return c.json(apiError('VALIDATION_ERROR', 'Матеріал не готовий до публікації'), 422);
    return c.json(apiSuccess(saved), 201);
  });
  app.put('/api/admin/posts/:id', async (c) => {
    const saved = await savePost(c.env, c.get('actor'), c.req.param('id'), await c.req.json());
    if (saved.kind === 'missing') return c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
    if (saved.kind === 'invalid')
      return c.json(apiError('VALIDATION_ERROR', 'Для оновлення потрібна актуальна version'), 422);
    if (saved.kind === 'conflict')
      return c.json(apiError('CONFLICT', 'Матеріал змінив інший редактор'), 409);
    return c.json(apiSuccess(saved));
  });
  app.delete('/api/admin/posts/:id', async (c) => {
    if (c.get('actor').role !== 'admin')
      return c.json(apiError('FORBIDDEN', 'Повне видалення доступне лише адміністратору'), 403);
    const id = c.req.param('id');
    const post = await c.env.DB.prepare('SELECT id,slug FROM posts WHERE id=?')
      .bind(id)
      .first<{ id: string; slug: string }>();
    if (!post) return c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
    const timestamp = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM post_categories WHERE post_id=?').bind(id),
      c.env.DB.prepare('DELETE FROM post_media WHERE post_id=?').bind(id),
      c.env.DB.prepare("DELETE FROM redirects WHERE entity_type='post' AND entity_id=?").bind(id),
      c.env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'post.delete',
        'post',
        id,
        JSON.stringify({ slug: post.slug }),
        timestamp,
      ),
    ]);
    return c.json(apiSuccess({ id, status: 'deleted' }));
  });
  app.get('/api/admin/categories', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    const where = search ? 'WHERE title_uk LIKE ? OR title_en LIKE ?' : '';
    const args = search ? [`%${search}%`, `%${search}%`] : [];
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT * FROM categories ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      ).bind(...args, p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare(`SELECT count(*) count FROM categories ${where}`).bind(...args),
    ]);
    return c.json(
      apiSuccess({
        items: results[0]!.results,
        total: Number((results[1]!.results[0] as { count: number }).count),
        page: p.page,
        pageSize: p.pageSize,
      }),
    );
  });
  app.delete('/api/admin/categories/:id', async (c) => {
    if (c.get('actor').role !== 'admin')
      return c.json(apiError('FORBIDDEN', 'Повне видалення доступне лише адміністратору'), 403);
    const id = c.req.param('id');
    const category = await c.env.DB.prepare('SELECT id,slug FROM categories WHERE id=?')
      .bind(id)
      .first<{ id: string; slug: string }>();
    if (!category) return c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
    const dependencies = await c.env.DB.batch([
      c.env.DB.prepare('SELECT count(*) count FROM post_categories WHERE category_id=?').bind(id),
      c.env.DB.prepare('SELECT count(*) count FROM categories WHERE parent_id=?').bind(id),
    ]);
    const posts = Number((dependencies[0]!.results[0] as { count: number }).count);
    const children = Number((dependencies[1]!.results[0] as { count: number }).count);
    if (posts || children)
      return c.json(
        apiError('CATEGORY_IN_USE', 'Спершу перепризначте пости та дочірні категорії'),
        409,
      );
    const timestamp = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM category_media WHERE category_id=?').bind(id),
      c.env.DB.prepare("DELETE FROM redirects WHERE entity_type='category' AND entity_id=?").bind(
        id,
      ),
      c.env.DB.prepare('DELETE FROM categories WHERE id=?').bind(id),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'category.delete',
        'category',
        id,
        JSON.stringify({ slug: category.slug }),
        timestamp,
      ),
    ]);
    return c.json(apiSuccess({ id, status: 'deleted' }));
  });
  app.get('/api/admin/categories/:id', async (c) => {
    const row = await c.env.DB.prepare('SELECT * FROM categories WHERE id=?')
      .bind(c.req.param('id'))
      .first();
    return row
      ? c.json(apiSuccess(row))
      : c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
  });
  app.post('/api/admin/categories', async (c) => {
    const d = categoryInputSchema.parse(await c.req.json());
    if (await categoryCreatesCycle(c.env.DB, undefined, d.parentId ?? null))
      return c.json(apiError('CATEGORY_CYCLE', 'Ієрархія категорій містить цикл'), 422);
    const collision = await c.env.DB.prepare('SELECT id FROM categories WHERE slug=?')
      .bind(d.slug)
      .first();
    if (collision)
      return c.json(apiError('SLUG_TAKEN', 'Такий slug уже використовується. Вкажіть інший.'), 409);
    const t = new Date().toISOString();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO categories(id,parent_id,slug,title_uk,title_en,description_md_uk,description_md_en,status,is_en_published,show_in_menu,menu_order,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
    )
      .bind(
        id,
        d.parentId ?? null,
        d.slug,
        d.titleUk,
        d.titleEn ?? null,
        d.descriptionMdUk ?? null,
        d.descriptionMdEn ?? null,
        d.status,
        Number(d.status === 'archived' ? false : d.isEnPublished),
        Number(d.showInMenu),
        d.menuOrder,
        t,
        t,
      )
      .run();
    return c.json(apiSuccess({ id }), 201);
  });
  app.put('/api/admin/categories/:id', async (c) => {
    const d = categoryInputSchema.parse(await c.req.json());
    const categoryId = c.req.param('id');
    if (d.version === undefined)
      return c.json(apiError('VALIDATION_ERROR', 'Для оновлення потрібна version'), 422);
    if (await categoryCreatesCycle(c.env.DB, categoryId, d.parentId ?? null))
      return c.json(apiError('CATEGORY_CYCLE', 'Ієрархія категорій містить цикл'), 422);
    const old = await c.env.DB.prepare('SELECT slug,status,revision FROM categories WHERE id=?')
      .bind(categoryId)
      .first<{ slug: string; status: string; revision: number }>();
    if (!old) return c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
    const t = new Date().toISOString();
    const mutationId = crypto.randomUUID();
    const nextRevision = d.version + 1;
    const guard = 'EXISTS (SELECT 1 FROM categories WHERE id=? AND revision=? AND mutation_id=?)';
    const update = c.env.DB.prepare(
      'UPDATE categories SET parent_id=?,slug=?,title_uk=?,title_en=?,description_md_uk=?,description_md_en=?,status=?,is_en_published=?,show_in_menu=?,menu_order=?,updated_at=?,revision=revision+1,mutation_id=? WHERE id=? AND revision=?',
    ).bind(
      d.parentId ?? null,
      d.slug,
      d.titleUk,
      d.titleEn ?? null,
      d.descriptionMdUk ?? null,
      d.descriptionMdEn ?? null,
      d.status,
      Number(d.status === 'archived' ? false : d.isEnPublished),
      Number(d.showInMenu),
      d.menuOrder,
      t,
      mutationId,
      categoryId,
      d.version,
    );
    const changes: D1PreparedStatement[] = [update];
    const guardArgs = [categoryId, nextRevision, mutationId];
    changes.push(
      c.env.DB.prepare(
        `INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        old.status === d.status ? 'category.update' : 'category.status_change',
        'category',
        categoryId,
        JSON.stringify({ slug: d.slug, status: d.status, previousStatus: old.status }),
        t,
        ...guardArgs,
      ),
    );
    if (old.slug !== d.slug) {
      changes.push(
        c.env.DB.prepare(
          `UPDATE redirects SET new_path=CASE WHEN old_path LIKE '/en/%' THEN ? ELSE ? END WHERE entity_type='category' AND entity_id=? AND ${guard}`,
        ).bind(`/en/category/${d.slug}`, `/category/${d.slug}`, categoryId, ...guardArgs),
        c.env.DB.prepare(`DELETE FROM redirects WHERE old_path IN (?,?) AND ${guard}`).bind(
          `/category/${d.slug}`,
          `/en/category/${d.slug}`,
          ...guardArgs,
        ),
        c.env.DB.prepare(
          `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
        ).bind(
          crypto.randomUUID(),
          `/category/${old.slug}`,
          `/category/${d.slug}`,
          301,
          'category',
          categoryId,
          t,
          ...guardArgs,
        ),
        c.env.DB.prepare(
          `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
        ).bind(
          crypto.randomUUID(),
          `/en/category/${old.slug}`,
          `/en/category/${d.slug}`,
          301,
          'category',
          categoryId,
          t,
          ...guardArgs,
        ),
      );
    }
    const results = await c.env.DB.batch(changes);
    if (!results[0]?.meta.changes)
      return c.json(apiError('CONFLICT', 'Категорія змінилася або не існує'), 409);
    return c.json(apiSuccess({ id: categoryId, updatedAt: t, revision: nextRevision }));
  });
  app.get('/api/admin/pages', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    const where = search ? 'WHERE title_uk LIKE ? OR title_en LIKE ?' : '';
    const args = search ? [`%${search}%`, `%${search}%`] : [];
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT * FROM pages ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      ).bind(...args, p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare(`SELECT count(*) count FROM pages ${where}`).bind(...args),
    ]);
    return c.json(
      apiSuccess({
        items: results[0]!.results,
        total: Number((results[1]!.results[0] as { count: number }).count),
        page: p.page,
        pageSize: p.pageSize,
      }),
    );
  });
  app.delete('/api/admin/pages/:id', async (c) => {
    if (c.get('actor').role !== 'admin')
      return c.json(apiError('FORBIDDEN', 'Повне видалення доступне лише адміністратору'), 403);
    const id = c.req.param('id');
    const page = await c.env.DB.prepare('SELECT id,slug FROM pages WHERE id=?')
      .bind(id)
      .first<{ id: string; slug: string }>();
    if (!page) return c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
    const timestamp = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM page_media WHERE page_id=?').bind(id),
      c.env.DB.prepare("DELETE FROM redirects WHERE entity_type='page' AND entity_id=?").bind(id),
      c.env.DB.prepare('DELETE FROM pages WHERE id=?').bind(id),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'page.delete',
        'page',
        id,
        JSON.stringify({ slug: page.slug }),
        timestamp,
      ),
    ]);
    return c.json(apiSuccess({ id, status: 'deleted' }));
  });
  app.get('/api/admin/pages/:id/preview', async (c) => {
    const page = await c.env.DB.prepare('SELECT * FROM pages WHERE id=?')
      .bind(c.req.param('id'))
      .first<Record<string, unknown>>();
    if (!page) return c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
    const locale = c.req.query('locale') === 'en' && page.title_en && page.body_md_en ? 'en' : 'uk';
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={`Preview: ${String(page[locale === 'en' ? 'title_en' : 'title_uk'])}`}
        robots="noindex,nofollow"
      >
        <article>
          <p>Preview — не публічна сторінка</p>
          <h1>{String(page[locale === 'en' ? 'title_en' : 'title_uk'])}</h1>
          <Markdown
            html={renderMarkdown(String(page[locale === 'en' ? 'body_md_en' : 'body_md_uk']))}
          />
        </article>
      </Layout>,
    );
  });
  app.get('/api/admin/pages/:id', async (c) => {
    const row = await c.env.DB.prepare('SELECT * FROM pages WHERE id=?')
      .bind(c.req.param('id'))
      .first();
    return row
      ? c.json(apiSuccess(row))
      : c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
  });
  app.post('/api/admin/pages', async (c) => {
    const d = pageInputSchema.parse(await c.req.json());
    const collision = await c.env.DB.prepare('SELECT id FROM pages WHERE slug=?')
      .bind(d.slug)
      .first();
    if (collision)
      return c.json(apiError('SLUG_TAKEN', 'Такий slug уже використовується. Вкажіть інший.'), 409);
    const t = new Date().toISOString();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO pages(id,slug,template,title_uk,title_en,body_md_uk,body_md_en,status,is_en_published,published_at,show_in_menu,menu_order,seo_title_uk,seo_title_en,seo_description_uk,seo_description_en,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    )
      .bind(
        id,
        d.slug,
        d.template,
        d.titleUk,
        d.titleEn ?? null,
        d.bodyMdUk,
        d.bodyMdEn ?? null,
        d.status,
        Number(d.status === 'archived' ? false : d.isEnPublished),
        d.status === 'published' ? t : null,
        Number(d.showInMenu),
        d.menuOrder,
        d.seoTitleUk ?? null,
        d.seoTitleEn ?? null,
        d.seoDescriptionUk ?? null,
        d.seoDescriptionEn ?? null,
        c.get('actor').id,
        c.get('actor').id,
        t,
        t,
      )
      .run();
    return c.json(apiSuccess({ id }), 201);
  });
  app.put('/api/admin/pages/:id', async (c) => {
    const d = pageInputSchema.parse(await c.req.json());
    if (d.version === undefined)
      return c.json(apiError('VALIDATION_ERROR', 'Для оновлення потрібна version'), 422);
    const pageId = c.req.param('id');
    const old = await c.env.DB.prepare('SELECT slug,status,revision FROM pages WHERE id=?')
      .bind(pageId)
      .first<{ slug: string; status: string; revision: number }>();
    if (!old) return c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
    const t = new Date().toISOString();
    const mutationId = crypto.randomUUID();
    const nextRevision = d.version + 1;
    const guard = 'EXISTS (SELECT 1 FROM pages WHERE id=? AND revision=? AND mutation_id=?)';
    const update = c.env.DB.prepare(
      "UPDATE pages SET slug=?,template=?,title_uk=?,title_en=?,body_md_uk=?,body_md_en=?,status=?,is_en_published=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END,show_in_menu=?,menu_order=?,seo_title_uk=?,seo_title_en=?,seo_description_uk=?,seo_description_en=?,updated_by=?,updated_at=?,revision=revision+1,mutation_id=? WHERE id=? AND revision=?",
    ).bind(
      d.slug,
      d.template,
      d.titleUk,
      d.titleEn ?? null,
      d.bodyMdUk,
      d.bodyMdEn ?? null,
      d.status,
      Number(d.status === 'archived' ? false : d.isEnPublished),
      d.status,
      t,
      Number(d.showInMenu),
      d.menuOrder,
      d.seoTitleUk ?? null,
      d.seoTitleEn ?? null,
      d.seoDescriptionUk ?? null,
      d.seoDescriptionEn ?? null,
      c.get('actor').id,
      t,
      mutationId,
      pageId,
      d.version,
    );
    const changes: D1PreparedStatement[] = [update];
    const guardArgs = [pageId, nextRevision, mutationId];
    changes.push(
      c.env.DB.prepare(
        `INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        old.status === d.status ? 'page.update' : 'page.status_change',
        'page',
        pageId,
        JSON.stringify({ slug: d.slug, status: d.status, previousStatus: old.status }),
        t,
        ...guardArgs,
      ),
    );
    if (old.slug !== d.slug) {
      changes.push(
        c.env.DB.prepare(
          `UPDATE redirects SET new_path=CASE WHEN old_path LIKE '/en/%' THEN ? ELSE ? END WHERE entity_type='page' AND entity_id=? AND ${guard}`,
        ).bind(`/en/${d.slug}`, `/${d.slug}`, pageId, ...guardArgs),
        c.env.DB.prepare(`DELETE FROM redirects WHERE old_path IN (?,?) AND ${guard}`).bind(
          `/${d.slug}`,
          `/en/${d.slug}`,
          ...guardArgs,
        ),
        c.env.DB.prepare(
          `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
        ).bind(
          crypto.randomUUID(),
          `/${old.slug}`,
          `/${d.slug}`,
          301,
          'page',
          pageId,
          t,
          ...guardArgs,
        ),
        c.env.DB.prepare(
          `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
        ).bind(
          crypto.randomUUID(),
          `/en/${old.slug}`,
          `/en/${d.slug}`,
          301,
          'page',
          pageId,
          t,
          ...guardArgs,
        ),
      );
    }
    const results = await c.env.DB.batch(changes);
    if (!results[0]?.meta.changes)
      return c.json(apiError('CONFLICT', 'Сторінка змінилася або не існує'), 409);
    return c.json(apiSuccess({ id: pageId, updatedAt: t, revision: nextRevision }));
  });
  app.use('/api/admin/users', requireAdmin);
  app.use('/api/admin/users/*', requireAdmin);
  app.use('/api/admin/settings', requireAdmin);
  app.use('/api/admin/redirects', requireAdmin);
  app.use('/api/admin/redirects/*', requireAdmin);
  app.use('/api/admin/audit-log', requireAdmin);
  app.get('/api/admin/users', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    return c.json(apiSuccess(await listUsers(c.env, p.page, p.pageSize)));
  });
  app.post('/api/admin/users', async (c) => {
    const d = userInputSchema.parse(await c.req.json());
    const id = crypto.randomUUID();
    const t = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare(
        'INSERT INTO users(id,email,name,role,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(id, d.email, d.name, d.role, Number(d.isActive), t, t),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'user.create',
        'user',
        id,
        JSON.stringify({ email: d.email, role: d.role }),
        t,
      ),
    ]);
    return c.json(apiSuccess({ id }), 201);
  });
  app.put('/api/admin/users/:id', async (c) => {
    const d = userInputSchema.parse(await c.req.json());
    const target = await c.env.DB.prepare('SELECT role,is_active FROM users WHERE id=?')
      .bind(c.req.param('id'))
      .first<{ role: 'admin' | 'editor'; is_active: number }>();
    if (!target) return c.json(apiError('NOT_FOUND', 'Користувача не знайдено'), 404);
    const userId = c.req.param('id');
    const t = new Date().toISOString();
    const update = c.env.DB.prepare(
      "UPDATE users SET email=?,name=?,role=?,is_active=?,updated_at=? WHERE id=? AND NOT (role='admin' AND is_active=1 AND (?=0 OR ?<>'admin') AND NOT EXISTS (SELECT 1 FROM users WHERE role='admin' AND is_active=1 AND id<>?))",
    ).bind(
      d.email,
      d.name,
      d.role,
      Number(d.isActive),
      t,
      userId,
      Number(d.isActive),
      d.role,
      userId,
    );
    const results = await c.env.DB.batch([
      update,
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND updated_at=?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'user.update',
        'user',
        userId,
        JSON.stringify({ email: d.email, role: d.role, isActive: d.isActive }),
        t,
        userId,
        t,
      ),
    ]);
    if (!results[0]?.meta.changes) {
      if (target.role === 'admin' && target.is_active && (!d.isActive || d.role !== 'admin'))
        return c.json(apiError('LAST_ADMIN', 'Не можна деактивувати останнього active admin'), 422);
      return c.json(apiError('CONFLICT', 'Користувач змінився під час операції'), 409);
    }
    return c.json(apiSuccess({ id: userId }));
  });
  app.delete('/api/admin/users/:id', async (c) => {
    const userId = c.req.param('id');
    const target = await c.env.DB.prepare('SELECT role,is_active FROM users WHERE id=?')
      .bind(userId)
      .first<{ role: 'admin' | 'editor'; is_active: number }>();
    if (!target) return c.json(apiError('NOT_FOUND', 'Користувача не знайдено'), 404);
    const timestamp = new Date().toISOString();
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE users SET is_active=0,updated_at=? WHERE id=? AND NOT (role='admin' AND is_active=1 AND NOT EXISTS (SELECT 1 FROM users WHERE role='admin' AND is_active=1 AND id<>?))",
      ).bind(timestamp, userId, userId),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND updated_at=?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'user.deactivate',
        'user',
        userId,
        '{}',
        timestamp,
        userId,
        timestamp,
      ),
    ]);
    if (!results[0]?.meta.changes)
      return target.role === 'admin' && target.is_active
        ? c.json(apiError('LAST_ADMIN', 'Не можна деактивувати останнього active admin'), 422)
        : c.json(apiError('CONFLICT', 'Користувач змінився під час операції'), 409);
    return c.json(apiSuccess({ id: userId, status: 'deactivated' }));
  });
  app.get('/api/admin/settings', async (c) =>
    c.json(
      apiSuccess(
        (
          await c.env.DB.prepare(
            "SELECT key,value_json,updated_at FROM settings WHERE key IN ('site','home')",
          ).all()
        ).results,
      ),
    ),
  );
  app.put('/api/admin/settings', async (c) => {
    const d = settingInputSchema.parse(await c.req.json());
    const t = new Date().toISOString();
    await c.env.DB.prepare(
      'INSERT INTO settings(key,value_json,updated_by,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at',
    )
      .bind(d.key, JSON.stringify(d.value), c.get('actor').id, t)
      .run();
    return c.json(apiSuccess({ key: d.key }));
  });
  app.get('/api/admin/redirects', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const results = await c.env.DB.batch([
      c.env.DB.prepare('SELECT * FROM redirects ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(
        p.pageSize,
        (p.page - 1) * p.pageSize,
      ),
      c.env.DB.prepare('SELECT count(*) count FROM redirects'),
    ]);
    return c.json(
      apiSuccess({
        items: results[0]!.results,
        total: Number((results[1]!.results[0] as { count: number }).count),
        page: p.page,
        pageSize: p.pageSize,
      }),
    );
  });
  app.delete('/api/admin/redirects/:id', async (c) => {
    const id = c.req.param('id');
    const timestamp = new Date().toISOString();
    const redirect = await c.env.DB.prepare('SELECT old_path,new_path FROM redirects WHERE id=?')
      .bind(id)
      .first<{ old_path: string; new_path: string }>();
    if (!redirect) return c.json(apiError('NOT_FOUND', 'Redirect не знайдено'), 404);
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM redirects WHERE id=?').bind(id),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'redirect.delete',
        'redirect',
        id,
        JSON.stringify({ oldPath: redirect.old_path, newPath: redirect.new_path }),
        timestamp,
      ),
    ]);
    return c.json(apiSuccess({ id }));
  });
  app.get('/api/admin/audit-log', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        'SELECT audit_logs.id,audit_logs.action,audit_logs.entity_type,audit_logs.entity_id,audit_logs.metadata_json,audit_logs.created_at,users.email actor_email FROM audit_logs LEFT JOIN users ON users.id=audit_logs.actor_user_id ORDER BY audit_logs.created_at DESC LIMIT ? OFFSET ?',
      ).bind(p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare('SELECT count(*) count FROM audit_logs'),
    ]);
    return c.json(
      apiSuccess({
        items: results[0]!.results,
        total: Number((results[1]!.results[0] as { count: number }).count),
        page: p.page,
        pageSize: p.pageSize,
      }),
    );
  });
}
