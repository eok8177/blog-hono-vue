import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { Context } from 'hono';
import { apiError, localeFromPath } from '@fauna/shared';
import type { Actor, Bindings } from './env';
import { registerAdminRoutes } from './routes/api/admin';
import { registerPublicRoutes } from './routes/public';
import { Layout } from './views/layout';

export type AppEnv = { Bindings: Bindings; Variables: { actor: Actor; requestId: string } };
const app = new Hono<AppEnv>();
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
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
    const databaseMessage = error instanceof Error ? `${error.message} ${cause}` : '';
    if (/UNIQUE constraint failed: (categories|posts|pages)\.slug/.test(databaseMessage)) {
      return c.json(apiError('SLUG_TAKEN', 'Такий slug уже використовується. Вкажіть інший.'), 409);
    }
    if (/UNIQUE constraint failed: users\.email/.test(databaseMessage)) {
      return c.json(apiError('EMAIL_TAKEN', 'Користувач із таким email уже існує.'), 409);
    }
    if (error instanceof ZodError) {
      const fields = Object.fromEntries(
        error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
      );
      return c.json(apiError('VALIDATION_ERROR', 'Перевірте поля форми', fields), 422);
    }
    return c.req.path.startsWith('/api/')
      ? c.json(apiError('INTERNAL', 'Сталася внутрішня помилка'), 500)
      : c.html(
          <Layout lang="uk" title="Помилка">
            <h1>Сталася помилка</h1>
          </Layout>,
          500,
        );
  }
  // Static Assets responses use immutable Headers, so always replace the response
  // with a clone before applying security headers.
  const headers = new Headers(c.res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'",
  );
  if (c.env.ENVIRONMENT === 'production')
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.res = new Response(c.res.body, { status: c.res.status, statusText: c.res.statusText, headers });
});

app.get('/assets/public.css', (c) =>
  c.body(
    'body{margin:0;font:17px/1.6 system-ui,sans-serif;color:#213128;background:#f8f7f1}a{color:#285c4d}.wrap{max-width:1080px;margin:auto;padding:1.25rem}header{background:#173b32;color:#fff}header a{color:#fff;margin-right:1rem}.card{background:#fff;border-radius:12px;padding:1.5rem;margin:1rem 0}main{min-height:70vh}article img{max-width:100%;height:auto}a:focus{outline:3px solid #d8a72a;outline-offset:3px}',
    200,
    { 'Content-Type': 'text/css; charset=UTF-8', 'Cache-Control': 'public, max-age=86400' },
  ),
);
app.get('/robots.txt', (c) =>
  c.text('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n'),
);
app.get('/sitemap.xml', async (c) => {
  const base = c.env.SITE_URL.replace(/\/$/, '');
  const rows = await c.env.DB.prepare(
    "SELECT slug,updated_at,is_en_published,'post' type FROM posts WHERE status='published' UNION ALL SELECT slug,updated_at,is_en_published,'page' type FROM pages WHERE status='published'",
  ).all<{ slug: string; updated_at: string; is_en_published: number; type: string }>();
  const urls = rows.results.flatMap((r) => {
    const path = r.type === 'page' ? `/${r.slug}` : `/post/${r.slug}`;
    return [
      `<url><loc>${base}${path}</loc><lastmod>${r.updated_at}</lastmod></url>`,
      ...(r.is_en_published
        ? [`<url><loc>${base}/en${path}</loc><lastmod>${r.updated_at}</lastmod></url>`]
        : []),
    ];
  });
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
    200,
    { 'Content-Type': 'application/xml; charset=UTF-8' },
  );
});
app.get('/en', (c) => c.redirect('/en/', 301));
app.get('/admin', (c) => c.redirect('/admin/', 301));
registerAdminRoutes(app);

registerPublicRoutes(app);

app.get('/admin/assets/*', async (c) => {
  const pathname = c.req.path.replace(/^\/admin/, '');
  return c.env.ASSETS.fetch(new Request(new URL(pathname, c.req.url)));
});
async function adminSpa(c: Context<AppEnv>) {
  const asset = await c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
  const headers = new Headers(asset.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(asset.body, { status: asset.status, headers });
}
// Explicit SPA routes make direct navigation/refresh unambiguous for the Worker router.
app.get('/admin/', adminSpa);
app.get('/admin/categories', adminSpa);
app.get('/admin/categories/new', adminSpa);
app.get('/admin/categories/:id', adminSpa);
app.get('/admin/posts', adminSpa);
app.get('/admin/posts/new', adminSpa);
app.get('/admin/posts/:id', adminSpa);
app.get('/admin/pages', adminSpa);
app.get('/admin/pages/new', adminSpa);
app.get('/admin/pages/:id', adminSpa);
app.get('/admin/media', adminSpa);
app.get('/admin/users', adminSpa);
app.get('/admin/settings', adminSpa);
app.get('/admin/redirects', adminSpa);
app.get('/admin/audit-log', adminSpa);
app.get('/admin/:path{.+}', adminSpa);
app.notFound((c) =>
  c.html(
    <Layout lang={localeFromPath(c.req.path)} title="404">
      <h1>404 — Сторінку не знайдено</h1>
    </Layout>,
    404,
  ),
);
export default app;
