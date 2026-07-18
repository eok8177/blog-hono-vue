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
import { renderMarkdown } from '../../utils/content';
import { Layout, Markdown } from '../../views/layout';

const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
};

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
    const relations = await c.env.DB.prepare(
      'SELECT media_id FROM post_media WHERE post_id=? ORDER BY position',
    )
      .bind(c.req.param('id'))
      .all<{ media_id: string }>();
    return c.json(
      apiSuccess({ ...row, mediaIds: relations.results.map((relation) => relation.media_id) }),
    );
  });
  app.post('/api/admin/posts', async (c) =>
    c.json(apiSuccess(await savePost(c.env, c.get('actor'), undefined, await c.req.json())), 201),
  );
  app.put('/api/admin/posts/:id', async (c) => {
    const saved = await savePost(c.env, c.get('actor'), c.req.param('id'), await c.req.json());
    if (saved.kind === 'missing') return c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
    if (saved.kind === 'conflict')
      return c.json(apiError('CONFLICT', 'Матеріал змінив інший редактор'), 409);
    return c.json(apiSuccess(saved));
  });
  app.delete('/api/admin/posts/:id', async (c) => {
    const t = new Date().toISOString();
    const result = await c.env.DB.prepare(
      "UPDATE posts SET status='archived',updated_at=? WHERE id=? AND status<>'archived'",
    )
      .bind(t, c.req.param('id'))
      .run();
    if (result.meta.changes)
      await c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      )
        .bind(
          crypto.randomUUID(),
          c.get('actor').id,
          'post.archive',
          'post',
          c.req.param('id'),
          '{}',
          t,
        )
        .run();
    return result.meta.changes
      ? c.json(apiSuccess({ id: c.req.param('id'), status: 'archived' }))
      : c.json(apiError('NOT_FOUND', 'Матеріал не знайдено або вже archived'), 404);
  });
  app.post('/api/admin/posts/:id/:action', async (c) => {
    const action = c.req.param('action');
    if (action !== 'publish' && action !== 'archive')
      return c.json(apiError('NOT_FOUND', 'Невідома дія'), 404);
    const timestamp = new Date().toISOString();
    const result = await c.env.DB.prepare(
      "UPDATE posts SET status=?,published_at=CASE WHEN ?='published' THEN coalesce(published_at,?) ELSE published_at END,updated_at=? WHERE id=?",
    )
      .bind(
        action === 'publish' ? 'published' : 'archived',
        action === 'publish' ? 'published' : 'archived',
        timestamp,
        timestamp,
        c.req.param('id'),
      )
      .run();
    if (!result.meta.changes) return c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
    await c.env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    )
      .bind(
        crypto.randomUUID(),
        c.get('actor').id,
        `post.${action}`,
        'post',
        c.req.param('id'),
        '{}',
        timestamp,
      )
      .run();
    return c.json(apiSuccess({ status: action }));
  });
  app.get('/api/admin/categories', async (c) =>
    c.json(
      apiSuccess(
        (
          await c.env.DB.prepare(
            'SELECT * FROM categories ORDER BY updated_at DESC LIMIT 100',
          ).all()
        ).results,
      ),
    ),
  );
  app.delete('/api/admin/categories/:id', async (c) => {
    const dependencies = await c.env.DB.batch([
      c.env.DB.prepare(
        'SELECT count(*) count FROM posts p JOIN post_categories pc ON pc.post_id=p.id WHERE pc.category_id=?',
      ).bind(c.req.param('id')),
      c.env.DB.prepare('SELECT count(*) count FROM categories WHERE parent_id=?').bind(
        c.req.param('id'),
      ),
    ]);
    const posts = (dependencies[0]!.results[0] as { count: number }).count;
    const children = (dependencies[1]!.results[0] as { count: number }).count;
    if (posts || children)
      return c.json(
        apiError('CATEGORY_IN_USE', 'Спершу перепризначте пости та дочірні категорії'),
        409,
      );
    const result = await c.env.DB.prepare(
      "UPDATE categories SET status='archived',updated_at=? WHERE id=?",
    )
      .bind(new Date().toISOString(), c.req.param('id'))
      .run();
    return result.meta.changes
      ? c.json(apiSuccess({ id: c.req.param('id'), status: 'archived' }))
      : c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
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
        Number(d.isEnPublished),
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
    const t = new Date().toISOString();
    const result = await c.env.DB.prepare(
      'UPDATE categories SET parent_id=?,slug=?,title_uk=?,title_en=?,description_md_uk=?,description_md_en=?,status=?,is_en_published=?,show_in_menu=?,menu_order=?,updated_at=? WHERE id=? AND updated_at=?',
    )
      .bind(
        d.parentId ?? null,
        d.slug,
        d.titleUk,
        d.titleEn ?? null,
        d.descriptionMdUk ?? null,
        d.descriptionMdEn ?? null,
        d.status,
        Number(d.isEnPublished),
        Number(d.showInMenu),
        d.menuOrder,
        t,
        c.req.param('id'),
        d.version ?? '',
      )
      .run();
    if (result.meta.changes === 0)
      return c.json(apiError('CONFLICT', 'Категорія змінилася або не існує'), 409);
    return c.json(apiSuccess({ id: c.req.param('id') }));
  });
  app.get('/api/admin/pages', async (c) =>
    c.json(
      apiSuccess(
        (await c.env.DB.prepare('SELECT * FROM pages ORDER BY updated_at DESC LIMIT 100').all())
          .results,
      ),
    ),
  );
  app.delete('/api/admin/pages/:id', async (c) => {
    const result = await c.env.DB.prepare(
      "UPDATE pages SET status='archived',updated_at=? WHERE id=? AND status<>'archived'",
    )
      .bind(new Date().toISOString(), c.req.param('id'))
      .run();
    return result.meta.changes
      ? c.json(apiSuccess({ id: c.req.param('id'), status: 'archived' }))
      : c.json(apiError('NOT_FOUND', 'Сторінку не знайдено або вже archived'), 404);
  });
  app.get('/api/admin/pages/:id/preview', async (c) => {
    const page = await c.env.DB.prepare('SELECT * FROM pages WHERE id=?')
      .bind(c.req.param('id'))
      .first<Record<string, unknown>>();
    if (!page) return c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
    const locale = c.req.query('locale') === 'en' && page.title_en && page.body_md_en ? 'en' : 'uk';
    return c.html(
      <Layout
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
        Number(d.isEnPublished),
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
    const t = new Date().toISOString();
    const result = await c.env.DB.prepare(
      'UPDATE pages SET slug=?,template=?,title_uk=?,title_en=?,body_md_uk=?,body_md_en=?,status=?,is_en_published=?,show_in_menu=?,menu_order=?,seo_title_uk=?,seo_title_en=?,seo_description_uk=?,seo_description_en=?,updated_by=?,updated_at=? WHERE id=? AND updated_at=?',
    )
      .bind(
        d.slug,
        d.template,
        d.titleUk,
        d.titleEn ?? null,
        d.bodyMdUk,
        d.bodyMdEn ?? null,
        d.status,
        Number(d.isEnPublished),
        Number(d.showInMenu),
        d.menuOrder,
        d.seoTitleUk ?? null,
        d.seoTitleEn ?? null,
        d.seoDescriptionUk ?? null,
        d.seoDescriptionEn ?? null,
        c.get('actor').id,
        t,
        c.req.param('id'),
        d.version ?? '',
      )
      .run();
    if (result.meta.changes === 0)
      return c.json(apiError('CONFLICT', 'Сторінка змінилася або не існує'), 409);
    return c.json(apiSuccess({ id: c.req.param('id') }));
  });
  app.use('/api/admin/users', requireAdmin);
  app.use('/api/admin/users/*', requireAdmin);
  app.use('/api/admin/settings', requireAdmin);
  app.use('/api/admin/redirects', requireAdmin);
  app.use('/api/admin/redirects/*', requireAdmin);
  app.use('/api/admin/audit-log', requireAdmin);
  app.get('/api/admin/users', async (c) =>
    c.json(
      apiSuccess(
        (
          await c.env.DB.prepare(
            'SELECT id,email,name,role,is_active,last_seen_at,created_at,updated_at FROM users ORDER BY created_at',
          ).all()
        ).results,
      ),
    ),
  );
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
    if (target.role === 'admin' && target.is_active && (!d.isActive || d.role !== 'admin')) {
      const count = await c.env.DB.prepare(
        "SELECT count(*) count FROM users WHERE role='admin' AND is_active=1",
      ).first<{ count: number }>();
      if ((count?.count ?? 0) <= 1)
        return c.json(apiError('LAST_ADMIN', 'Не можна деактивувати останнього active admin'), 422);
    }
    const t = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE users SET email=?,name=?,role=?,is_active=?,updated_at=? WHERE id=?',
      ).bind(d.email, d.name, d.role, Number(d.isActive), t, c.req.param('id')),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'user.update',
        'user',
        c.req.param('id'),
        JSON.stringify({ email: d.email, role: d.role, isActive: d.isActive }),
        t,
      ),
    ]);
    return c.json(apiSuccess({ id: c.req.param('id') }));
  });
  app.delete('/api/admin/users/:id', async (c) => {
    const target = await c.env.DB.prepare('SELECT role,is_active FROM users WHERE id=?')
      .bind(c.req.param('id'))
      .first<{ role: 'admin' | 'editor'; is_active: number }>();
    if (!target) return c.json(apiError('NOT_FOUND', 'Користувача не знайдено'), 404);
    if (target.role === 'admin' && target.is_active) {
      const count = await c.env.DB.prepare(
        "SELECT count(*) count FROM users WHERE role='admin' AND is_active=1",
      ).first<{ count: number }>();
      if ((count?.count ?? 0) <= 1)
        return c.json(apiError('LAST_ADMIN', 'Не можна видалити останнього active admin'), 422);
    }
    await c.env.DB.prepare('DELETE FROM users WHERE id=?').bind(c.req.param('id')).run();
    return c.json(apiSuccess({ id: c.req.param('id') }));
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
  app.get('/api/admin/redirects', async (c) =>
    c.json(
      apiSuccess(
        (await c.env.DB.prepare('SELECT * FROM redirects ORDER BY created_at DESC LIMIT 200').all())
          .results,
      ),
    ),
  );
  app.delete('/api/admin/redirects/:id', async (c) => {
    await c.env.DB.prepare('DELETE FROM redirects WHERE id=?').bind(c.req.param('id')).run();
    return c.json(apiSuccess({ id: c.req.param('id') }));
  });
  app.get('/api/admin/audit-log', async (c) =>
    c.json(
      apiSuccess(
        (
          await c.env.DB.prepare(
            'SELECT audit_logs.id,audit_logs.action,audit_logs.entity_type,audit_logs.entity_id,audit_logs.metadata_json,audit_logs.created_at,users.email actor_email FROM audit_logs LEFT JOIN users ON users.id=audit_logs.actor_user_id ORDER BY audit_logs.created_at DESC LIMIT 200',
          ).all()
        ).results,
      ),
    ),
  );
}
