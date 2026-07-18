import type { Context } from 'hono';
import {
  apiError,
  apiSuccess,
  ftsPrefixQuery,
  mediaUpdateSchema,
  paginationSchema,
} from '@fauna/shared';
import type { AppEnv } from '../../index';
import { requireAdmin } from '../../middleware/auth';
import { findPost, listPublished } from '../../services/posts';
import { renderMarkdown } from '../../utils/content';
import { inspectImage, sha256 } from '../../utils/media';
import { Layout, Markdown, SectionLabel } from '../../views/layout';

export function registerPublicRoutes(app: import('hono').Hono<AppEnv>) {
  async function readSettings(env: AppEnv['Bindings'], key: 'site' | 'home') {
    const row = await env.DB.prepare('SELECT value_json FROM settings WHERE key=?')
      .bind(key)
      .first<{ value_json: string }>();
    if (!row) return {} as Record<string, unknown>;
    try {
      const value: unknown = JSON.parse(row.value_json);
      return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    } catch {
      return {} as Record<string, unknown>;
    }
  }
  const settingText = (value: unknown, fallback: string) =>
    typeof value === 'string' && value.trim() ? value : fallback;
  async function readNavigation(env: AppEnv['Bindings'], locale: 'uk' | 'en') {
    const titleColumn = locale === 'en' ? 'title_en' : 'title_uk';
    const translation =
      locale === 'en' ? ` AND ${titleColumn} IS NOT NULL AND trim(${titleColumn}) <> ''` : '';
    const rows = await env.DB.prepare(
      `SELECT 'page' entity_type,slug,${titleColumn} title,menu_order FROM pages WHERE status='published' AND show_in_menu=1${translation}
       UNION ALL
       SELECT 'category' entity_type,slug,${titleColumn} title,menu_order FROM categories WHERE status='published' AND show_in_menu=1${locale === 'en' ? ` AND is_en_published=1${translation}` : ''}
       ORDER BY menu_order ASC, title ASC LIMIT 20`,
    ).all<{ entity_type: 'page' | 'category'; slug: string; title: string; menu_order: number }>();
    return rows.results.map((item) => ({
      label: item.title,
      href:
        locale === 'en'
          ? item.entity_type === 'page'
            ? `/en/${item.slug}`
            : `/en/category/${item.slug}`
          : item.entity_type === 'page'
            ? `/${item.slug}`
            : `/category/${item.slug}`,
    }));
  }
  app.get('/api/search', async (c) => {
    const requestedLocale = c.req.query('locale') ?? 'uk';
    if (requestedLocale !== 'uk' && requestedLocale !== 'en')
      return c.json(apiError('INVALID_LOCALE', 'Підтримуються лише locale uk або en'), 422);
    const locale = requestedLocale;
    const query = ftsPrefixQuery(c.req.query('q') ?? '');
    const p = paginationSchema.parse(c.req.query());
    if (!query)
      return c.json(
        apiSuccess({ items: [], total: 0, query: '', page: p.page, pageSize: p.pageSize }),
      );
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        'SELECT entity_type,entity_id,title,summary FROM content_fts WHERE content_fts MATCH ? AND locale=? LIMIT ? OFFSET ?',
      ).bind(query, locale, p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare(
        'SELECT count(*) count FROM content_fts WHERE content_fts MATCH ? AND locale=?',
      ).bind(query, locale),
    ]);
    return c.json(
      apiSuccess({
        items: results[0]!.results,
        total: Number((results[1]!.results[0] as { count: number }).count),
        query: c.req.query('q') ?? '',
        page: p.page,
        pageSize: p.pageSize,
      }),
    );
  });

  async function renderHome(c: Context<AppEnv>, locale: 'uk' | 'en') {
    const [posts, settings, site, categories] = await Promise.all([
      listPublished(c.env, locale),
      readSettings(c.env, 'home'),
      readSettings(c.env, 'site'),
      c.env.DB.prepare(
        `SELECT slug,title_${locale} title FROM categories WHERE status='published'${locale === 'en' ? ' AND is_en_published=1' : ''} ORDER BY menu_order, title LIMIT 6`,
      ).all<{ slug: string; title: string }>(),
    ]);
    const title = settingText(
      settings[locale === 'en' ? 'heroTitleEn' : 'heroTitleUk'],
      settingText(
        site[locale === 'en' ? 'titleEn' : 'titleUk'],
        locale === 'en' ? 'Fauna of Southern Ukraine' : 'Фауна півдня України',
      ),
    );
    const intro = settingText(
      settings[locale === 'en' ? 'introEn' : 'introUk'],
      locale === 'en'
        ? 'A living archive of observations, field notes and research from the southern Ukrainian landscape.'
        : 'Живий архів спостережень, польових нотаток і досліджень ландшафтів півдня України.',
    );
    const basePath = locale === 'en' ? '/en' : '';
    const menuItems = await readNavigation(c.env, locale);
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={title}
        description={settingText(site[locale === 'en' ? 'descriptionEn' : 'descriptionUk'], intro)}
        menuItems={menuItems}
      >
        <section class="hero" aria-labelledby="home-title">
          <span class="hero-orbit hero-orbit-left" aria-hidden="true" />
          <span class="hero-orbit hero-orbit-right" aria-hidden="true" />
          <div class="hero-inner">
            <p class="eyebrow">
              {locale === 'en' ? 'A field archive · since 2024' : 'Польовий архів · з 2024 року'}
            </p>
            <h1 id="home-title">{title}</h1>
            <p class="hero-intro">{intro}</p>
            <div class="hero-rule" aria-hidden="true">
              {locale === 'en' ? 'in careful observation' : 'у уважному спостереженні'}
            </div>
          </div>
        </section>
        <section class="section" aria-labelledby="recent-title">
          <div class="shell">
            <SectionLabel>{locale === 'en' ? 'The archive' : 'Архів'}</SectionLabel>
            <div class="section-heading">
              <h2 id="recent-title">
                {locale === 'en' ? 'Recent observations' : 'Останні спостереження'}
              </h2>
              <p>
                {locale === 'en'
                  ? 'Notes from years of patient attention to the steppe, coast and wetlands.'
                  : 'Нотатки з років уважного спостереження за степом, узбережжям і водно-болотними угіддями.'}
              </p>
            </div>
            <div class="archive-grid">
              {posts.results
                .slice(0, 6)
                .map(
                  (p: {
                    slug: string;
                    title: string;
                    excerpt: string | null;
                    published_at?: string;
                  }) => (
                    <article class="card" key={p.slug}>
                      <p class="post-meta">
                        {p.published_at
                          ? new Date(p.published_at).toLocaleDateString(
                              locale === 'uk' ? 'uk-UA' : 'en-GB',
                              { year: 'numeric', month: 'short' },
                            )
                          : locale === 'en'
                            ? 'Archive note'
                            : 'Архівна нотатка'}
                      </p>
                      <h2>
                        <a href={`${basePath}/post/${p.slug}`}>{p.title}</a>
                      </h2>
                      <p>
                        {p.excerpt ||
                          (locale === 'en'
                            ? 'Read the full field note.'
                            : 'Переглянути повну польову нотатку.')}
                      </p>
                      <a class="read-more" href={`${basePath}/post/${p.slug}`}>
                        {locale === 'en' ? 'Read note' : 'Читати нотатку'}
                      </a>
                    </article>
                  ),
                )}
            </div>
            {!posts.results.length ? (
              <p class="empty-state">
                {locale === 'en'
                  ? 'The first observations will appear here soon.'
                  : 'Перші спостереження скоро з’являться тут.'}
              </p>
            ) : null}
          </div>
        </section>
        <section class="section" aria-labelledby="categories-title">
          <div class="shell archive-note">
            <div>
              <p class="eyebrow">{locale === 'en' ? 'Ways into the archive' : 'Розділи архіву'}</p>
              <h2 id="categories-title">
                {locale === 'en'
                  ? 'A landscape is never just one story.'
                  : 'Ландшафт ніколи не є лише однією історією.'}
              </h2>
            </div>
            <div>
              <p class="note-mark">
                {locale === 'en' ? 'Explore by subject' : 'Досліджуйте за темою'}
              </p>
              {categories.results.map((category) => (
                <p key={category.slug}>
                  <a class="text-link" href={`${basePath}/category/${category.slug}`}>
                    {category.title}
                  </a>
                </p>
              ))}
            </div>
          </div>
        </section>
      </Layout>,
    );
  }
  app.get('/', (c) => renderHome(c, 'uk'));
  app.get('/en/', (c) => renderHome(c, 'en'));
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
    const menuItems = await readNavigation(c.env, locale);
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={title}
        description={String(post[locale === 'en' ? 'excerpt_en' : 'excerpt_uk'] ?? '')}
        canonical={locale === 'en' ? enHref : ukHref}
        menuItems={menuItems}
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
        <div class="page-shell narrow">
          <nav class="breadcrumb" aria-label={locale === 'uk' ? 'Навігація' : 'Breadcrumb'}>
            <a href={locale === 'en' ? '/en/' : '/'}>{locale === 'en' ? 'Archive' : 'Архів'}</a>
            <span aria-hidden="true"> / </span>
            <a href={locale === 'en' ? '/en/category/doslidzhennia' : '/category/doslidzhennia'}>
              {locale === 'en' ? 'Research' : 'Дослідження'}
            </a>
          </nav>
          <article>
            <header class="post-header">
              <p class="post-meta">
                <span>{locale === 'uk' ? 'Публікація' : 'Field note'}</span>
                {post.published_at ? (
                  <time dateTime={String(post.published_at)}>
                    {new Date(String(post.published_at)).toLocaleDateString(
                      locale === 'uk' ? 'uk-UA' : 'en-GB',
                      { year: 'numeric', month: 'long', day: 'numeric' },
                    )}
                  </time>
                ) : null}
              </p>
              <h1 class="page-title">{title}</h1>
              {post[locale === 'en' ? 'excerpt_en' : 'excerpt_uk'] ? (
                <p class="lede">{String(post[locale === 'en' ? 'excerpt_en' : 'excerpt_uk'])}</p>
              ) : null}
            </header>
            <div class="post-body">
              <Markdown html={renderMarkdown(body)} />
            </div>
            {gallery.results.length ? (
              <section class="gallery" aria-label={locale === 'uk' ? 'Галерея' : 'Gallery'}>
                <h2>{locale === 'uk' ? 'Галерея спостережень' : 'Observation gallery'}</h2>
                <div class="gallery-grid">
                  {gallery.results.map((image) => (
                    <figure key={image.id}>
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
                </div>
              </section>
            ) : null}
          </article>
        </div>
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
    const menuItems = await readNavigation(c.env, locale);
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={locale === 'uk' ? 'Пошук' : 'Search'}
        robots="noindex,follow"
        menuItems={menuItems}
        canonical={`${c.env.SITE_URL.replace(/\/$/, '')}${path}`}
      >
        <div class="page-shell">
          <p class="eyebrow">{locale === 'uk' ? 'Пошук в архіві' : 'Search the archive'}</p>
          <h1 class="page-title">
            {locale === 'uk' ? 'Знайти спостереження' : 'Find an observation'}
          </h1>
          <p class="lede">
            {locale === 'uk'
              ? 'Пошук за назвою та змістом опублікованих матеріалів.'
              : 'Search titles and full text across published materials.'}
          </p>
          <form class="search-form" action={path}>
            <label class="visually-hidden" htmlFor="archive-search">
              {locale === 'uk' ? 'Запит' : 'Query'}
            </label>
            <input
              class="search-input"
              id="archive-search"
              name="q"
              minLength={2}
              value={rawQuery}
              placeholder={
                locale === 'uk' ? 'Наприклад, степ або птахи' : 'For example, steppe or birds'
              }
            />
            <button class="button" type="submit">
              {locale === 'uk' ? 'Шукати' : 'Search'}
            </button>
          </form>
          {rawQuery ? (
            <section aria-live="polite">
              <SectionLabel>{locale === 'uk' ? 'Результати' : 'Results'}</SectionLabel>
              {result.results.length ? (
                <div class="search-results">
                  {result.results.map((item) => (
                    <article class="card">
                      <p class="post-meta">
                        {item.entity_type === 'post'
                          ? locale === 'uk'
                            ? 'Публікація'
                            : 'Publication'
                          : locale === 'uk'
                            ? 'Сторінка'
                            : 'Page'}
                      </p>
                      <h2>
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
                      </h2>
                      <p>{item.summary}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p class="empty-state">
                  {locale === 'uk' ? 'Нічого не знайдено.' : 'No results found.'}
                </p>
              )}
            </section>
          ) : null}
        </div>
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
    const menuItems = await readNavigation(c.env, locale);
    const total = (queries[1]!.results[0] as { count: number }).count;
    const pages = Math.max(1, Math.ceil(total / p.pageSize));
    const posts = queries[0]!.results as Array<{
      slug: string;
      title: string | null;
      excerpt: string | null;
    }>;
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={title}
        description={String(
          category[locale === 'en' ? 'description_md_en' : 'description_md_uk'] ?? '',
        )}
        canonical={canonical}
        menuItems={menuItems}
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
        <div class="page-shell">
          <nav class="breadcrumb" aria-label={locale === 'uk' ? 'Навігація' : 'Breadcrumb'}>
            <a href={locale === 'en' ? '/en/' : '/'}>{locale === 'en' ? 'Archive' : 'Архів'}</a>
            <span aria-hidden="true"> / </span>
            {locale === 'en' ? 'Research' : 'Дослідження'}
          </nav>
          <header class="listing-header">
            <div>
              <p class="eyebrow">{locale === 'en' ? 'Field notes' : 'Польові нотатки'}</p>
              <h1>{title}</h1>
            </div>
            <p>
              {String(
                category[locale === 'en' ? 'description_md_en' : 'description_md_uk'] ??
                  (locale === 'en'
                    ? 'Observations gathered across the southern landscape.'
                    : 'Спостереження, зібрані в ландшафтах півдня України.'),
              )}
            </p>
          </header>
          {posts.length ? (
            <div class="post-list">
              {posts.map((post) => (
                <article class="listing-card">
                  <p class="post-meta">{locale === 'en' ? 'Publication' : 'Публікація'}</p>
                  <div>
                    <h2>
                      <a href={locale === 'en' ? `/en/post/${post.slug}` : `/post/${post.slug}`}>
                        {String(post.title)}
                      </a>
                    </h2>
                    <p>{String(post.excerpt ?? '')}</p>
                  </div>
                  <a
                    class="listing-arrow"
                    aria-label={
                      locale === 'en'
                        ? `Read ${String(post.title)}`
                        : `Читати ${String(post.title)}`
                    }
                    href={locale === 'en' ? `/en/post/${post.slug}` : `/post/${post.slug}`}
                  >
                    ↗
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p class="empty-state">
              {locale === 'en'
                ? 'No published observations in this category yet.'
                : 'У цій категорії ще немає опублікованих матеріалів.'}
            </p>
          )}
          <nav class="pagination" aria-label={locale === 'uk' ? 'Пагінація' : 'Pagination'}>
            {p.page > 1 ? (
              <a href={`${basePath}?page=${p.page - 1}`}>
                ← {locale === 'en' ? 'Previous' : 'Попередня'}
              </a>
            ) : (
              <span />
            )}
            {p.page < pages ? (
              <a href={`${basePath}?page=${p.page + 1}`}>
                {locale === 'en' ? 'Next' : 'Наступна'} →
              </a>
            ) : null}
          </nav>
        </div>
      </Layout>,
    );
  }
  app.get('/category/:slug', (c) => renderCategory(c, 'uk'));
  app.get('/en/category/:slug', (c) => renderCategory(c, 'en'));
  app.get('/api/admin/media', async (c) => {
    const p = paginationSchema.parse(c.req.query());
    const search = (c.req.query('q') ?? '').slice(0, 100);
    const where = search
      ? 'WHERE alt_uk LIKE ? OR alt_en LIKE ? OR caption_uk LIKE ? OR caption_en LIKE ?'
      : '';
    const args = search ? Array(4).fill(`%${search}%`) : [];
    const results = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT id,variant_480_key,variant_960_key,variant_1600_key,mime_type,width,height,size_bytes,alt_uk,alt_en,caption_uk,caption_en,credit,license,status,created_at,updated_at FROM media ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ).bind(...args, p.pageSize, (p.page - 1) * p.pageSize),
      c.env.DB.prepare(`SELECT count(*) count FROM media ${where}`).bind(...args),
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
  app.use('/api/admin/media/:id', requireAdmin);
  app.delete('/api/admin/media/:id', async (c) => {
    const id = c.req.param('id');
    const media = await c.env.DB.prepare(
      'SELECT original_key,variant_480_key,variant_960_key,variant_1600_key FROM media WHERE id=?',
    )
      .bind(id)
      .first<{
        original_key: string | null;
        variant_480_key: string | null;
        variant_960_key: string | null;
        variant_1600_key: string | null;
      }>();
    if (!media) return c.json(apiError('NOT_FOUND', 'Файл не знайдено'), 404);
    const relations = await c.env.DB.batch([
      c.env.DB.prepare('SELECT count(*) count FROM post_media WHERE media_id=?').bind(id),
      c.env.DB.prepare('SELECT count(*) count FROM page_media WHERE media_id=?').bind(id),
      c.env.DB.prepare('SELECT count(*) count FROM category_media WHERE media_id=?').bind(id),
    ]);
    if (
      relations.some(
        (result: D1Result<unknown>) => Number((result.results[0] as { count: number }).count) > 0,
      )
    )
      return c.json(
        apiError('MEDIA_IN_USE', 'Файл використовується матеріалами і не може бути видалений'),
        409,
      );
    const timestamp = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM media WHERE id=?').bind(id),
      c.env.DB.prepare(
        'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        c.get('actor').id,
        'media.hard_delete',
        'media',
        id,
        '{}',
        timestamp,
      ),
    ]);
    const keys = [
      media.original_key,
      media.variant_480_key,
      media.variant_960_key,
      media.variant_1600_key,
    ].filter((key): key is string => Boolean(key));
    try {
      await Promise.all(keys.map((key) => c.env.MEDIA.delete(key)));
    } catch (error) {
      console.error(
        JSON.stringify({
          requestId: c.get('requestId'),
          event: 'media.orphan_cleanup_failed',
          id,
          error: String(error),
        }),
      );
      return c.json(
        apiError('ORPHAN_CLEANUP_FAILED', 'Metadata видалено, але cleanup R2 потребує перевірки'),
        500,
      );
    }
    return c.json(apiSuccess({ id, status: 'deleted' }));
  });
  app.post('/api/admin/media', async (c) => {
    const contentLength = Number(c.req.header('Content-Length') ?? 0);
    if (contentLength > 21 * 1024 * 1024)
      return c.json(apiError('PAYLOAD_TOO_LARGE', 'Upload не може перевищувати 20 MB'), 413);
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
    const declaredTotal = variants.reduce(
      (sum, value) => sum + (value instanceof File ? value.size : 0),
      0,
    );
    if (
      declaredTotal > 20 * 1024 * 1024 ||
      variants.some((value) => value instanceof File && value.size > 20 * 1024 * 1024)
    )
      return c.json(
        apiError('PAYLOAD_TOO_LARGE', 'Загальний розмір variants не може перевищувати 20 MB'),
        413,
      );
    const files = await Promise.all(
      variants.map(async (file) => ({ file, bytes: new Uint8Array(await file.arrayBuffer()) })),
    );
    const inspected = files.map(({ bytes }) => inspectImage(bytes));
    const allowedWidths = [480, 960, 1600];
    if (
      inspected.some(
        (image, index) =>
          !image ||
          image.mimeType !== 'image/webp' ||
          image.width < 1 ||
          image.height < 1 ||
          image.width > allowedWidths[index]! ||
          image.width * image.height > 20_000_000 ||
          Math.max(image.width / image.height, image.height / image.width) > 20,
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
          : variant === '1600'
            ? media?.variant_1600_key
            : null;
    if (!key || !media) return c.notFound();
    const object = await c.env.MEDIA.get(key);
    if (!object) return c.notFound();
    return new Response(object.body, {
      headers: {
        'Content-Type': media.mime_type,
        ...(object.size ? { 'Content-Length': String(object.size) } : {}),
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
    const menuItems = await readNavigation(c.env, locale);
    return c.html(
      <Layout
        nonce={c.get('cspNonce')}
        lang={locale}
        title={title}
        canonical={locale === 'en' ? enHref : ukHref}
        menuItems={menuItems}
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
        <div class="page-shell narrow">
          <nav class="breadcrumb" aria-label={locale === 'uk' ? 'Навігація' : 'Breadcrumb'}>
            <a href={locale === 'en' ? '/en/' : '/'}>{locale === 'en' ? 'Archive' : 'Архів'}</a>
            <span aria-hidden="true"> / </span>
            {title}
          </nav>
          <article>
            <p class="eyebrow">{locale === 'en' ? 'About the archive' : 'Про архів'}</p>
            <h1 class="page-title">{title}</h1>
            <div class="post-body">
              <Markdown html={renderMarkdown(body)} />
            </div>
          </article>
        </div>
      </Layout>,
    );
  }
  app.get('/en/:slug', (c) => renderPage(c, 'en'));
  app.get('/:slug', (c) => renderPage(c, 'uk'));
}
