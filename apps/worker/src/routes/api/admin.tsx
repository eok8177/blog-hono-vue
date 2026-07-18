import type { MiddlewareHandler } from 'hono';
import { apiError, apiSuccess, paginationSchema } from '@fauna/shared';
import type { AppEnv } from '../../index';
import {
  createCategory,
  deleteCategory,
  findAdminCategory,
  listAdminCategories,
  updateCategory,
} from '../../services/categories';
import { getDashboardStats } from '../../services/dashboard';
import {
  createPage,
  deletePage,
  findAdminPage,
  listAdminPages,
  updatePage,
} from '../../services/pages';
import {
  deletePost,
  findAdminPost,
  findAdminPostWithRelations,
  listAdminPosts,
  savePost,
} from '../../services/posts';
import { deleteRedirect, listRedirects } from '../../services/redirects';
import { listSettings, updateSettings } from '../../services/settings';
import { listAuditLogs } from '../../services/audit-logs';
import { createUser, deactivateUser, listUsers, updateUser } from '../../services/users';
import { requireActor, requireAdmin } from '../../middleware/auth';
import { renderMarkdown } from '../../utils/content';
import { Layout, Markdown } from '../../views/layout';

const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
};

export function registerAdminRoutes(app: import('hono').Hono<AppEnv>) {
  app.use('/api/admin/*', noStore, requireActor);
  app.get('/api/admin/session', (c) => c.json(apiSuccess(c.get('actor'))));
  app.get('/api/admin/dashboard', async (c) => c.json(apiSuccess(await getDashboardStats(c.env))));

  app.get('/api/admin/posts', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    return c.json(apiSuccess(await listAdminPosts(c.env, pagination, search)));
  });
  app.get('/api/admin/posts/:id/preview', async (c) => {
    const post = await findAdminPost(c.env, c.req.param('id'));
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
    const post = await findAdminPostWithRelations(c.env, c.req.param('id'));
    return post
      ? c.json(apiSuccess(post))
      : c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
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
    const result = await deletePost(c.env, c.get('actor'), c.req.param('id'));
    return result.kind === 'missing'
      ? c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404)
      : c.json(apiSuccess({ id: result.id, status: 'deleted' }));
  });

  app.get('/api/admin/categories', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    return c.json(apiSuccess(await listAdminCategories(c.env, pagination, search)));
  });
  app.delete('/api/admin/categories/:id', async (c) => {
    if (c.get('actor').role !== 'admin')
      return c.json(apiError('FORBIDDEN', 'Повне видалення доступне лише адміністратору'), 403);
    const result = await deleteCategory(c.env, c.get('actor'), c.req.param('id'));
    if (result.kind === 'missing')
      return c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
    if (result.kind === 'in_use')
      return c.json(
        apiError('CATEGORY_IN_USE', 'Спершу перепризначте пости та дочірні категорії'),
        409,
      );
    return c.json(apiSuccess({ id: result.id, status: 'deleted' }));
  });
  app.get('/api/admin/categories/:id', async (c) => {
    const category = await findAdminCategory(c.env, c.req.param('id'));
    return category
      ? c.json(apiSuccess(category))
      : c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
  });
  app.post('/api/admin/categories', async (c) => {
    const result = await createCategory(c.env, await c.req.json());
    if (result.kind === 'cycle')
      return c.json(apiError('CATEGORY_CYCLE', 'Ієрархія категорій містить цикл'), 422);
    if (result.kind === 'slug_taken')
      return c.json(apiError('SLUG_TAKEN', 'Такий slug уже використовується. Вкажіть інший.'), 409);
    return c.json(apiSuccess({ id: result.id }), 201);
  });
  app.put('/api/admin/categories/:id', async (c) => {
    const result = await updateCategory(
      c.env,
      c.get('actor'),
      c.req.param('id'),
      await c.req.json(),
    );
    if (result.kind === 'invalid')
      return c.json(apiError('VALIDATION_ERROR', 'Для оновлення потрібна version'), 422);
    if (result.kind === 'cycle')
      return c.json(apiError('CATEGORY_CYCLE', 'Ієрархія категорій містить цикл'), 422);
    if (result.kind === 'missing')
      return c.json(apiError('NOT_FOUND', 'Категорію не знайдено'), 404);
    if (result.kind === 'conflict')
      return c.json(apiError('CONFLICT', 'Категорія змінилася або не існує'), 409);
    return c.json(
      apiSuccess({ id: result.id, updatedAt: result.updatedAt, revision: result.revision }),
    );
  });

  app.get('/api/admin/pages', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    return c.json(apiSuccess(await listAdminPages(c.env, pagination, search)));
  });
  app.delete('/api/admin/pages/:id', async (c) => {
    if (c.get('actor').role !== 'admin')
      return c.json(apiError('FORBIDDEN', 'Повне видалення доступне лише адміністратору'), 403);
    const result = await deletePage(c.env, c.get('actor'), c.req.param('id'));
    return result.kind === 'missing'
      ? c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404)
      : c.json(apiSuccess({ id: result.id, status: 'deleted' }));
  });
  app.get('/api/admin/pages/:id/preview', async (c) => {
    const page = await findAdminPage(c.env, c.req.param('id'));
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
    const page = await findAdminPage(c.env, c.req.param('id'));
    return page
      ? c.json(apiSuccess(page))
      : c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
  });
  app.post('/api/admin/pages', async (c) => {
    const result = await createPage(c.env, c.get('actor'), await c.req.json());
    if (result.kind === 'slug_taken')
      return c.json(apiError('SLUG_TAKEN', 'Такий slug уже використовується. Вкажіть інший.'), 409);
    return c.json(apiSuccess({ id: result.id }), 201);
  });
  app.put('/api/admin/pages/:id', async (c) => {
    const result = await updatePage(c.env, c.get('actor'), c.req.param('id'), await c.req.json());
    if (result.kind === 'invalid')
      return c.json(apiError('VALIDATION_ERROR', 'Для оновлення потрібна version'), 422);
    if (result.kind === 'missing')
      return c.json(apiError('NOT_FOUND', 'Сторінку не знайдено'), 404);
    if (result.kind === 'conflict')
      return c.json(apiError('CONFLICT', 'Сторінка змінилася або не існує'), 409);
    return c.json(
      apiSuccess({ id: result.id, updatedAt: result.updatedAt, revision: result.revision }),
    );
  });

  app.use('/api/admin/users', requireAdmin);
  app.use('/api/admin/users/*', requireAdmin);
  app.use('/api/admin/settings', requireAdmin);
  app.use('/api/admin/redirects', requireAdmin);
  app.use('/api/admin/redirects/*', requireAdmin);
  app.use('/api/admin/audit-log', requireAdmin);
  app.get('/api/admin/users', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    return c.json(apiSuccess(await listUsers(c.env, pagination.page, pagination.pageSize)));
  });
  app.post('/api/admin/users', async (c) => {
    const result = await createUser(c.env, c.get('actor'), await c.req.json());
    return c.json(apiSuccess({ id: result.id }), 201);
  });
  app.put('/api/admin/users/:id', async (c) => {
    const result = await updateUser(c.env, c.get('actor'), c.req.param('id'), await c.req.json());
    if (result.kind === 'missing')
      return c.json(apiError('NOT_FOUND', 'Користувача не знайдено'), 404);
    if (result.kind === 'last_admin')
      return c.json(apiError('LAST_ADMIN', 'Не можна деактивувати останнього active admin'), 422);
    if (result.kind === 'conflict')
      return c.json(apiError('CONFLICT', 'Користувач змінився під час операції'), 409);
    return c.json(apiSuccess({ id: result.id }));
  });
  app.delete('/api/admin/users/:id', async (c) => {
    const result = await deactivateUser(c.env, c.get('actor'), c.req.param('id'));
    if (result.kind === 'missing')
      return c.json(apiError('NOT_FOUND', 'Користувача не знайдено'), 404);
    if (result.kind === 'last_admin')
      return c.json(apiError('LAST_ADMIN', 'Не можна деактивувати останнього active admin'), 422);
    if (result.kind === 'conflict')
      return c.json(apiError('CONFLICT', 'Користувач змінився під час операції'), 409);
    return c.json(apiSuccess({ id: result.id, status: 'deactivated' }));
  });

  app.get('/api/admin/settings', async (c) => c.json(apiSuccess(await listSettings(c.env))));
  app.put('/api/admin/settings', async (c) => {
    const saved = await updateSettings(c.env, c.get('actor'), await c.req.json());
    return c.json(apiSuccess(saved));
  });
  app.get('/api/admin/redirects', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    return c.json(apiSuccess(await listRedirects(c.env, pagination)));
  });
  app.delete('/api/admin/redirects/:id', async (c) => {
    const result = await deleteRedirect(c.env, c.get('actor'), c.req.param('id'));
    return result.kind === 'missing'
      ? c.json(apiError('NOT_FOUND', 'Redirect не знайдено'), 404)
      : c.json(apiSuccess({ id: result.id }));
  });
  app.get('/api/admin/audit-log', async (c) => {
    const pagination = paginationSchema.parse(c.req.query());
    return c.json(apiSuccess(await listAuditLogs(c.env, pagination)));
  });
}
