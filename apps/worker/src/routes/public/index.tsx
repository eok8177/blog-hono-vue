import type { Context } from 'hono';
import {
  apiError,
  apiSuccess,
  ftsPrefixQuery,
  mediaUpdateSchema,
  paginationSchema,
} from '@fauna/shared';
import type { AppEnv } from '../../index';
import { findPost, listPublished } from '../../services/posts';
import { renderMarkdown } from '../../utils/content';
import { inspectImage, sha256 } from '../../utils/media';
import { Layout, Markdown } from '../../views/layout';

export function registerPublicRoutes(app: import('hono').Hono<AppEnv>) {
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
    if (!post) {
      const redirect = await c.env.DB.prepare(
        'SELECT new_path,status_code FROM redirects WHERE old_path=?',
      )
        .bind(c.req.path)
        .first<{ new_path: string; status_code: 301 | 308 }>();
      return redirect && redirect.new_path !== c.req.path
        ? c.redirect(redirect.new_path, redirect.status_code)
        : c.notFound();
    }
    const gallery = await c.env.DB.prepare(
      `SELECT m.id,m.width,m.height,m.alt_${locale} alt,m.caption_${locale} caption FROM post_media pm JOIN media m ON m.id=pm.media_id WHERE pm.post_id=? AND m.status='ready' ORDER BY pm.position`,
    )
      .bind(String(post.id))
      .all<{
        id: string;
        width: number;
        height: number;
        alt: string | null;
        caption: string | null;
      }>();
    const title = String(post[locale === 'en' ? 'title_en' : 'title_uk']);
    const body = String(post[locale === 'en' ? 'body_md_en' : 'body_md_uk']);
    const base = c.env.SITE_URL.replace(/\/$/, '');
    const slug = c.req.param('slug') ?? '';
    const ukHref = `${base}/post/${slug}`;
    const enHref = `${base}/en/post/${slug}`;
    const hasEnglish = Number(post.is_en_published) === 1;
    return c.html(
      <Layout
        lang={locale}
        title={title}
        description={String(post[locale === 'en' ? 'excerpt_en' : 'excerpt_uk'] ?? '')}
        canonical={locale === 'en' ? enHref : ukHref}
        languageHref={locale === 'en' ? ukHref : hasEnglish ? enHref : '/en/'}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          datePublished: String(post.published_at),
          dateModified: String(post.updated_at),
          mainEntityOfPage: locale === 'en' ? enHref : ukHref,
          inLanguage: locale,
        }}
        alternates={
          locale === 'en' || hasEnglish
            ? [
                { lang: 'uk', href: ukHref },
                ...(hasEnglish
                  ? [
                      { lang: 'en' as const, href: enHref },
                      { lang: 'x-default' as const, href: ukHref },
                    ]
                  : []),
              ]
            : []
        }
      >
        <article>
          <h1>{title}</h1>
          <Markdown html={renderMarkdown(body)} />
          {gallery.results.length ? (
            <section aria-label="Галерея">
              <h2>Галерея</h2>
              {gallery.results.map((image) => (
                <figure>
                  <img
                    src={`/media/${image.id}/960`}
                    alt={image.alt ?? ''}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                  />
                  {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                </figure>
              ))}
            </section>
          ) : null}
        </article>
      </Layout>,
    );
  }
  app.get('/search', (c) => searchPage(c, 'uk'));
  app.get('/en/search', (c) => searchPage(c, 'en'));
  async function searchPage(c: Context<AppEnv>, locale: 'uk' | 'en') {
    const rawQuery = c.req.query('q') ?? '';
    const query = ftsPrefixQuery(rawQuery);
    const p = paginationSchema.parse(c.req.query());
    const result = query
      ? await c.env.DB.prepare(
          "SELECT f.entity_type,f.entity_id,f.title,f.summary,COALESCE(p.slug,pg.slug) slug FROM content_fts f LEFT JOIN posts p ON f.entity_type='post' AND p.id=f.entity_id LEFT JOIN pages pg ON f.entity_type='page' AND pg.id=f.entity_id WHERE f.content_fts MATCH ? AND f.locale=? LIMIT ? OFFSET ?",
        )
          .bind(query, locale, p.pageSize, (p.page - 1) * p.pageSize)
          .all<{
            entity_type: 'post' | 'page';
            entity_id: string;
            title: string;
            summary: string;
            slug: string;
          }>()
      : {
          results: [] as Array<{
            entity_type: 'post' | 'page';
            entity_id: string;
            title: string;
            summary: string;
            slug: string;
          }>,
        };
    const path = locale === 'en' ? '/en/search' : '/search';
    return c.html(
      <Layout
        lang={locale}
        title={locale === 'uk' ? 'Пошук' : 'Search'}
        robots="noindex,follow"
        canonical={`${c.env.SITE_URL.replace(/\/$/, '')}${path}`}
      >
        <h1>{locale === 'uk' ? 'Пошук' : 'Search'}</h1>
        <form action={path}>
          <label>
            Запит <input name="q" minLength={2} value={rawQuery} />
          </label>
          <button>{locale === 'uk' ? 'Шукати' : 'Search'}</button>
        </form>
        {rawQuery ? (
          <section aria-live="polite">
            <h2>{locale === 'uk' ? 'Результати' : 'Results'}</h2>
            {result.results.length ? (
              result.results.map((item) => (
                <article class="card">
                  <h3>
                    <a
                      href={
                        item.entity_type === 'post'
                          ? locale === 'en'
                            ? `/en/post/${item.slug}`
                            : `/post/${item.slug}`
                          : locale === 'en'
                            ? `/en/${item.slug}`
                            : `/${item.slug}`
                      }
                    >
                      {item.title}
                    </a>
                  </h3>
                  <p>{item.summary}</p>
                </article>
              ))
            ) : (
              <p>{locale === 'uk' ? 'Нічого не знайдено.' : 'No results found.'}</p>
            )}
          </section>
        ) : null}
      </Layout>,
    );
  }
  async function renderCategory(c: Context<AppEnv>, locale: 'uk' | 'en') {
    const slug = c.req.param('slug') ?? '';
    const translation = locale === 'en' ? ' AND is_en_published=1' : '';
    const category = await c.env.DB.prepare(
      `SELECT * FROM categories WHERE slug=? AND status='published'${translation}`,
    )
      .bind(slug)
      .first<Record<string, unknown>>();
    if (!category) return c.notFound();
    const p = paginationSchema.parse(c.req.query());
    const postTranslation = locale === 'en' ? ' AND p.is_en_published=1' : '';
    const queries = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT p.slug,p.title_${locale} title,p.excerpt_${locale} excerpt,p.published_at FROM posts p JOIN post_categories pc ON pc.post_id=p.id WHERE pc.category_id=? AND p.status='published'${postTranslation} ORDER BY p.published_at DESC LIMIT ? OFFSET ?`,
      ).bind(category.id, p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare(
        `SELECT count(*) count FROM posts p JOIN post_categories pc ON pc.post_id=p.id WHERE pc.category_id=? AND p.status='published'${postTranslation}`,
      ).bind(category.id),
    ]);
    const basePath = locale === 'en' ? `/en/category/${slug}` : `/category/${slug}`;
    const base = c.env.SITE_URL.replace(/\/$/, '');
    const suffix = p.page > 1 ? `?page=${p.page}` : '';
    const canonical = `${base}${basePath}${suffix}`;
    const ukHref = `${base}/category/${slug}${suffix}`;
    const enHref = `${base}/en/category/${slug}${suffix}`;
    const hasEnglish = Number(category.is_en_published) === 1;
    const title = String(category[locale === 'en' ? 'title_en' : 'title_uk']);
    const total = (queries[1]!.results[0] as { count: number }).count;
    const pages = Math.max(1, Math.ceil(total / p.pageSize));
    const posts = queries[0]!.results as Array<{
      slug: string;
      title: string | null;
      excerpt: string | null;
    }>;
    return c.html(
      <Layout
        lang={locale}
        title={title}
        description={String(
          category[locale === 'en' ? 'description_md_en' : 'description_md_uk'] ?? '',
        )}
        canonical={canonical}
        languageHref={locale === 'en' ? ukHref : hasEnglish ? enHref : '/en/'}
        alternates={
          locale === 'en' || hasEnglish
            ? [
                { lang: 'uk', href: ukHref },
                ...(hasEnglish
                  ? [
                      { lang: 'en' as const, href: enHref },
                      { lang: 'x-default' as const, href: ukHref },
                    ]
                  : []),
              ]
            : []
        }
      >
        <nav aria-label="Breadcrumb">
          <a href={locale === 'en' ? '/en/' : '/'}>Архів</a> / {title}
        </nav>
        <h1>{title}</h1>
        {posts.length ? (
          posts.map((post) => (
            <article class="card">
              <h2>
                <a href={locale === 'en' ? `/en/post/${post.slug}` : `/post/${post.slug}`}>
                  {String(post.title)}
                </a>
              </h2>
              <p>{String(post.excerpt ?? '')}</p>
            </article>
          ))
        ) : (
          <p>У цій категорії ще немає опублікованих матеріалів.</p>
        )}
        <nav aria-label="Пагінація">
          {p.page > 1 ? <a href={`${basePath}?page=${p.page - 1}`}>← Попередня</a> : null}
          {p.page < pages ? <a href={`${basePath}?page=${p.page + 1}`}>Наступна →</a> : null}
        </nav>
      </Layout>,
    );
  }
  app.get('/category/:slug', (c) => renderCategory(c, 'uk'));
  app.get('/en/category/:slug', (c) => renderCategory(c, 'en'));
  app.get('/api/admin/media', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const result = await c.env.DB.prepare(
      'SELECT id,variant_480_key,variant_960_key,variant_1600_key,mime_type,width,height,size_bytes,alt_uk,alt_en,caption_uk,caption_en,credit,license,status,created_at,updated_at FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?',
    )
      .bind(p.pageSize, (p.page - 1) * p.pageSize)
      .all();
    return c.json(apiSuccess({ items: result.results, page: p.page, pageSize: p.pageSize }));
  });
  app.get('/api/admin/media/:id', async (c) => {
    const row = await c.env.DB.prepare('SELECT * FROM media WHERE id=?')
      .bind(c.req.param('id'))
      .first();
    return row ? c.json(apiSuccess(row)) : c.json(apiError('NOT_FOUND', 'Файл не знайдено'), 404);
  });
  app.put('/api/admin/media/:id', async (c) => {
    const d = mediaUpdateSchema.parse(await c.req.json());
    const t = new Date().toISOString();
    const result = await c.env.DB.prepare(
      'UPDATE media SET alt_uk=?,alt_en=?,caption_uk=?,caption_en=?,credit=?,license=?,source_url=?,updated_at=? WHERE id=? AND updated_at=?',
    )
      .bind(
        d.altUk,
        d.altEn ?? null,
        d.captionUk ?? null,
        d.captionEn ?? null,
        d.credit ?? null,
        d.license ?? null,
        d.sourceUrl ?? null,
        t,
        c.req.param('id'),
        d.version,
      )
      .run();
    return result.meta.changes
      ? c.json(apiSuccess({ id: c.req.param('id'), updatedAt: t }))
      : c.json(apiError('CONFLICT', 'Файл змінився або не існує'), 409);
  });
  app.delete('/api/admin/media/:id', async (c) => {
    const result = await c.env.DB.prepare(
      "UPDATE media SET status='archived',updated_at=? WHERE id=? AND status<>'archived'",
    )
      .bind(new Date().toISOString(), c.req.param('id'))
      .run();
    return result.meta.changes
      ? c.json(apiSuccess({ id: c.req.param('id'), status: 'archived' }))
      : c.json(apiError('NOT_FOUND', 'Файл не знайдено або вже archived'), 404);
  });
  app.post('/api/admin/media', async (c) => {
    const form = await c.req.formData();
    const altUk = form.get('altUk');
    const variants = [form.get('variant480'), form.get('variant960'), form.get('variant1600')];
    if (
      typeof altUk !== 'string' ||
      !altUk.trim() ||
      !variants.every((value): value is File => value instanceof File)
    )
      return c.json(
        apiError('VALIDATION_ERROR', 'Потрібні alt українською та три WebP variants'),
        422,
      );
    const files = await Promise.all(
      variants.map(async (file) => ({ file, bytes: new Uint8Array(await file.arrayBuffer()) })),
    );
    const inspected = files.map(({ bytes }) => inspectImage(bytes));
    if (
      inspected.some(
        (image) => !image || image.mimeType !== 'image/webp' || image.width < 1 || image.height < 1,
      )
    )
      return c.json(
        apiError('INVALID_MEDIA', 'Variants мають бути валідними WebP зображеннями до 20 MB'),
        422,
      );
    const total = files.reduce((sum, item) => sum + item.bytes.byteLength, 0);
    if (total > 20 * 1024 * 1024)
      return c.json(
        apiError('PAYLOAD_TOO_LARGE', 'Загальний розмір variants не може перевищувати 20 MB'),
        413,
      );
    const hashes = await Promise.all(files.map(({ bytes }) => sha256(bytes)));
    const keys = hashes.map((hash, index) => `variants/${hash}-${[480, 960, 1600][index]}.webp`);
    try {
      await Promise.all(
        files.map(({ bytes }, index) =>
          c.env.MEDIA.put(keys[index]!, bytes, {
            httpMetadata: {
              contentType: 'image/webp',
              cacheControl: 'public, max-age=31536000, immutable',
            },
          }),
        ),
      );
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const largest = inspected[2]!;
      await c.env.DB.prepare(
        'INSERT INTO media(id,variant_480_key,variant_960_key,variant_1600_key,mime_type,width,height,size_bytes,sha256,alt_uk,alt_en,caption_uk,caption_en,credit,license,source_url,status,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
        .bind(
          id,
          keys[0]!,
          keys[1]!,
          keys[2]!,
          'image/webp',
          largest.width,
          largest.height,
          total,
          hashes[2]!,
          altUk.trim(),
          typeof form.get('altEn') === 'string' ? String(form.get('altEn')) : null,
          typeof form.get('captionUk') === 'string' ? String(form.get('captionUk')) : null,
          typeof form.get('captionEn') === 'string' ? String(form.get('captionEn')) : null,
          typeof form.get('credit') === 'string' ? String(form.get('credit')) : null,
          typeof form.get('license') === 'string' ? String(form.get('license')) : null,
          typeof form.get('sourceUrl') === 'string' ? String(form.get('sourceUrl')) : null,
          'ready',
          c.get('actor').id,
          timestamp,
          timestamp,
        )
        .run();
      return c.json(apiSuccess({ id }), 201);
    } catch (error) {
      await Promise.all(keys.map((key) => c.env.MEDIA.delete(key)));
      throw error;
    }
  });
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

  async function renderPage(c: Context<AppEnv>, locale: 'uk' | 'en') {
    const page = await c.env.DB.prepare(
      `SELECT * FROM pages WHERE slug=? AND status='published'${locale === 'en' ? ' AND is_en_published=1' : ''}`,
    )
      .bind(c.req.param('slug') ?? '')
      .first<Record<string, unknown>>();
    if (!page) {
      const redirect = await c.env.DB.prepare(
        'SELECT new_path,status_code FROM redirects WHERE old_path=?',
      )
        .bind(c.req.path)
        .first<{ new_path: string; status_code: 301 | 308 }>();
      return redirect && redirect.new_path !== c.req.path
        ? c.redirect(redirect.new_path, redirect.status_code)
        : c.notFound();
    }
    const title = String(page[locale === 'en' ? 'title_en' : 'title_uk']);
    const body = String(page[locale === 'en' ? 'body_md_en' : 'body_md_uk']);
    const base = c.env.SITE_URL.replace(/\/$/, '');
    const slug = c.req.param('slug') ?? '';
    const ukHref = `${base}/${slug}`;
    const enHref = `${base}/en/${slug}`;
    const hasEnglish = Number(page.is_en_published) === 1;
    return c.html(
      <Layout
        lang={locale}
        title={title}
        canonical={locale === 'en' ? enHref : ukHref}
        languageHref={locale === 'en' ? ukHref : hasEnglish ? enHref : '/en/'}
        alternates={
          locale === 'en' || hasEnglish
            ? [
                { lang: 'uk', href: ukHref },
                ...(hasEnglish
                  ? [
                      { lang: 'en' as const, href: enHref },
                      { lang: 'x-default' as const, href: ukHref },
                    ]
                  : []),
              ]
            : []
        }
      >
        <article>
          <h1>{title}</h1>
          <Markdown html={renderMarkdown(body)} />
        </article>
      </Layout>,
    );
  }
  app.get('/en/:slug', (c) => renderPage(c, 'en'));
  app.get('/:slug', (c) => renderPage(c, 'uk'));
}
