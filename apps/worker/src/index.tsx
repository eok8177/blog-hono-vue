import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Context, MiddlewareHandler } from 'hono';
import {
  apiError,
  apiSuccess,
  ftsPrefixQuery,
  localeFromPath,
  paginationSchema,
} from '@fauna/shared';
import type { Actor, Bindings } from './env';
import { requireActor, requireAdmin } from './middleware/auth';
import { findPost, listPublished, savePost } from './services/posts';
import { renderMarkdown } from './utils/content';
import { Layout, Markdown } from './views/layout';

type AppEnv = { Bindings: Bindings; Variables: { actor: Actor; requestId: string } };
const app = new Hono<AppEnv>();
const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
};
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  try {
    await next();
  } catch (error) {
    console.error(
      JSON.stringify({
        requestId: c.get('requestId'),
        path: c.req.path,
        error: error instanceof Error ? error.message : 'unknown',
      }),
    );
    if (error instanceof HTTPException) return error.getResponse();
    return c.req.path.startsWith('/api/')
      ? c.json(apiError('INTERNAL', 'Сталася внутрішня помилка'), 500)
      : c.html(
          <Layout lang="uk" title="Помилка">
            <h1>Сталася помилка</h1>
          </Layout>,
          500,
        );
  }
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'",
  );
});

app.get('/robots.txt', (c) =>
  c.text('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n'),
);
app.get('/sitemap.xml', async (c) => {
  const base = c.env.SITE_URL.replace(/\/$/, '');
  const rows = await c.env.DB.prepare(
    "SELECT slug,updated_at,is_en_published,'post' type FROM posts WHERE status='published' UNION ALL SELECT slug,updated_at,is_en_published,'page' type FROM pages WHERE status='published'",
  ).all<{ slug: string; updated_at: string; is_en_published: number; type: string }>();
  const urls = rows.results.flatMap((r) => [
    `<url><loc>${base}/${r.type}/${r.slug}</loc><lastmod>${r.updated_at}</lastmod></url>`,
    ...(r.is_en_published
      ? [`<url><loc>${base}/en/${r.type}/${r.slug}</loc><lastmod>${r.updated_at}</lastmod></url>`]
      : []),
  ]);
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
    200,
    { 'Content-Type': 'application/xml; charset=UTF-8' },
  );
});
app.get('/en', (c) => c.redirect('/en/', 301));
app.get('/admin', (c) => c.redirect('/admin/', 301));
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
app.get('/api/admin/posts/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM posts WHERE id=?')
    .bind(c.req.param('id'))
    .first();
  return row ? c.json(apiSuccess(row)) : c.json(apiError('NOT_FOUND', 'Матеріал не знайдено'), 404);
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
app.post('/api/admin/posts/:id/:action', async (c) => {
  const action = c.req.param('action');
  if (action !== 'publish' && action !== 'archive')
    return c.json(apiError('NOT_FOUND', 'Невідома дія'), 404);
  const timestamp = new Date().toISOString();
  await c.env.DB.prepare(
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
  return c.json(apiSuccess({ status: action }));
});
app.get('/api/admin/categories', async (c) =>
  c.json(
    apiSuccess(
      (await c.env.DB.prepare('SELECT * FROM categories ORDER BY updated_at DESC LIMIT 100').all())
        .results,
    ),
  ),
);
app.get('/api/admin/pages', async (c) =>
  c.json(
    apiSuccess(
      (await c.env.DB.prepare('SELECT * FROM pages ORDER BY updated_at DESC LIMIT 100').all())
        .results,
    ),
  ),
);
app.use('/api/admin/users/*', requireAdmin);
app.get('/api/admin/users', async (c) =>
  c.json(
    apiSuccess(
      (
        await c.env.DB.prepare(
          'SELECT id,email,name,role,is_active,last_seen_at,created_at,updated_at FROM users',
        ).all()
      ).results,
    ),
  ),
);
app.get('/api/search', async (c) => {
  const locale = c.req.query('locale') === 'en' ? 'en' : 'uk';
  const query = ftsPrefixQuery(c.req.query('q') ?? '');
  if (!query) return c.json(apiSuccess({ items: [], query: '' }));
  const p = paginationSchema.parse(c.req.query());
  const result = await c.env.DB.prepare(
    'SELECT entity_type,entity_id,title,summary FROM content_fts WHERE content_fts MATCH ? AND locale=? LIMIT ? OFFSET ?',
  )
    .bind(query, locale, p.pageSize, (p.page - 1) * p.pageSize)
    .all();
  return c.json(apiSuccess({ items: result.results, query: c.req.query('q') ?? '' }));
});

app.get('/', async (c) => {
  const posts = await listPublished(c.env, 'uk');
  return c.html(
    <Layout lang="uk" title="Архів фауни півдня України" description="Дослідницький архів">
      <h1>Архів фауни півдня України</h1>
      <p>Тестовий електронний архів спостережень, матеріалів і досліджень.</p>
      {posts.results.map((p) => (
        <article class="card">
          <h2>
            <a href={`/post/${p.slug}`}>{p.title}</a>
          </h2>
          <p>{p.excerpt}</p>
        </article>
      ))}
    </Layout>,
  );
});
app.get('/en/', async (c) => {
  const posts = await listPublished(c.env, 'en');
  return c.html(
    <Layout lang="en" title="Fauna Archive of Southern Ukraine">
      <h1>Fauna Archive of Southern Ukraine</h1>
      {posts.results.map((p) => (
        <article class="card">
          <h2>
            <a href={`/en/post/${p.slug}`}>{p.title}</a>
          </h2>
          <p>{p.excerpt}</p>
        </article>
      ))}
    </Layout>,
  );
});
app.get('/post/:slug', async (c) => renderPost(c, 'uk'));
app.get('/en/post/:slug', async (c) => renderPost(c, 'en'));
async function renderPost(c: Context<AppEnv>, locale: 'uk' | 'en') {
  const post = await findPost(c.env, c.req.param('slug') ?? '', locale);
  if (!post) return c.notFound();
  const title = String(post[locale === 'en' ? 'title_en' : 'title_uk']);
  const body = String(post[locale === 'en' ? 'body_md_en' : 'body_md_uk']);
  return c.html(
    <Layout
      lang={locale}
      title={title}
      description={String(post[locale === 'en' ? 'excerpt_en' : 'excerpt_uk'] ?? '')}
    >
      <article>
        <h1>{title}</h1>
        <Markdown html={renderMarkdown(body)} />
      </article>
    </Layout>,
  );
}
app.get('/search', (c) => searchPage(c, 'uk'));
app.get('/en/search', (c) => searchPage(c, 'en'));
function searchPage(c: Context<AppEnv>, locale: 'uk' | 'en') {
  return c.html(
    <Layout lang={locale} title={locale === 'uk' ? 'Пошук' : 'Search'}>
      <h1>{locale === 'uk' ? 'Пошук' : 'Search'}</h1>
      <form action="/api/search">
        <label>
          Запит <input name="q" minLength={2} />
        </label>
        <input type="hidden" name="locale" value={locale} />
        <button>Шукати</button>
      </form>
    </Layout>,
  );
}
const category = (c: Context<AppEnv>) =>
  c.html(
    <Layout lang={localeFromPath(c.req.path)} title="Категорія">
      <h1>Категорія</h1>
      <p>Матеріали категорії.</p>
    </Layout>,
  );
app.get('/category/:slug', category);
app.get('/en/category/:slug', category);
app.get('/media/:id/:variant', async (c) => {
  const media = await c.env.DB.prepare(
    "SELECT variant_480_key,variant_960_key,variant_1600_key,mime_type FROM media WHERE id=? AND status='ready'",
  )
    .bind(c.req.param('id'))
    .first<{
      variant_480_key: string;
      variant_960_key: string;
      variant_1600_key: string;
      mime_type: string;
    }>();
  const variant = c.req.param('variant');
  const key =
    variant === '480'
      ? media?.variant_480_key
      : variant === '960'
        ? media?.variant_960_key
        : media?.variant_1600_key;
  if (!key || !media) return c.notFound();
  const object = await c.env.MEDIA.get(key);
  if (!object) return c.notFound();
  return new Response(object.body, {
    headers: {
      'Content-Type': media.mime_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
    },
  });
});
app.get('/admin/*', async (c) => {
  const asset = await c.env.ASSETS.fetch(new Request(new URL('/admin/index.html', c.req.url)));
  const headers = new Headers(asset.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(asset.body, { status: asset.status, headers });
});
async function renderPage(c: Context<AppEnv>, locale: 'uk' | 'en') {
  const page = await c.env.DB.prepare(
    `SELECT * FROM pages WHERE slug=? AND status='published'${locale === 'en' ? ' AND is_en_published=1' : ''}`,
  )
    .bind(c.req.param('slug') ?? '')
    .first<Record<string, unknown>>();
  if (!page) return c.notFound();
  const title = String(page[locale === 'en' ? 'title_en' : 'title_uk']);
  const body = String(page[locale === 'en' ? 'body_md_en' : 'body_md_uk']);
  return c.html(
    <Layout lang={locale} title={title}>
      <article>
        <h1>{title}</h1>
        <Markdown html={renderMarkdown(body)} />
      </article>
    </Layout>,
  );
}
app.get('/en/:slug', (c) => renderPage(c, 'en'));
app.get('/:slug', (c) => renderPage(c, 'uk'));
app.notFound((c) =>
  c.html(
    <Layout lang={localeFromPath(c.req.path)} title="404">
      <h1>404 — Сторінку не знайдено</h1>
    </Layout>,
    404,
  ),
);
export default app;
