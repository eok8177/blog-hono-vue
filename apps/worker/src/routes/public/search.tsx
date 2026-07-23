import type { Context, Hono } from 'hono';
import { apiError, apiSuccess, ftsPrefixQuery, paginationSchema } from '@fauna/shared';
import type { AppEnv } from '../../index';
import { Layout, SectionLabel } from '../../views/layout';
import { readNavigation, siteUrl } from './shared';

type Locale = 'uk' | 'en';
type SearchResult = {
  entity_type: 'post' | 'page';
  entity_id: string;
  title: string;
  summary: string;
  slug: string;
};

export function registerSearchRoutes(app: Hono<AppEnv>) {
  app.get('/api/search', searchApi);
  app.get('/search', (c) => renderSearchPage(c, 'uk'));
  app.get('/en/search', (c) => renderSearchPage(c, 'en'));
}

async function searchApi(c: Context<AppEnv>) {
  const requestedLocale = c.req.query('locale') ?? 'uk';
  if (requestedLocale !== 'uk' && requestedLocale !== 'en')
    return c.json(apiError('INVALID_LOCALE', 'Підтримуються лише locale uk або en'), 422);

  const query = ftsPrefixQuery(c.req.query('q') ?? '');
  const pagination = paginationSchema.parse(c.req.query());
  if (!query)
    return c.json(
      apiSuccess({
        items: [],
        total: 0,
        query: '',
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    );

  const results = await c.env.DB.batch([
    c.env.DB.prepare(
      'SELECT entity_type,entity_id,title,summary FROM content_fts WHERE content_fts MATCH ? AND locale=? LIMIT ? OFFSET ?',
    ).bind(
      query,
      requestedLocale,
      pagination.pageSize,
      (pagination.page - 1) * pagination.pageSize,
    ),
    c.env.DB.prepare(
      'SELECT count(*) count FROM content_fts WHERE content_fts MATCH ? AND locale=?',
    ).bind(query, requestedLocale),
  ]);

  return c.json(
    apiSuccess({
      items: results[0]!.results,
      total: Number((results[1]!.results[0] as { count: number }).count),
      query: c.req.query('q') ?? '',
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  );
}

async function renderSearchPage(c: Context<AppEnv>, locale: Locale) {
  const rawQuery = c.req.query('q') ?? '';
  const query = ftsPrefixQuery(rawQuery);
  const pagination = paginationSchema.parse(c.req.query());
  const result = query
    ? await c.env.DB.prepare(
        "SELECT f.entity_type,f.entity_id,f.title,f.summary,COALESCE(p.slug,pg.slug) slug FROM content_fts f LEFT JOIN posts p ON f.entity_type='post' AND p.id=f.entity_id LEFT JOIN pages pg ON f.entity_type='page' AND pg.id=f.entity_id WHERE f.content_fts MATCH ? AND f.locale=? LIMIT ? OFFSET ?",
      )
        .bind(query, locale, pagination.pageSize, (pagination.page - 1) * pagination.pageSize)
        .all<SearchResult>()
    : { results: [] as SearchResult[] };
  const path = locale === 'en' ? '/en/search' : '/search';
  const menuItems = await readNavigation(c.env, locale);

  return c.html(
    <Layout
      nonce={c.get('cspNonce')}
      lang={locale}
      title={locale === 'uk' ? 'Пошук' : 'Search'}
      robots="noindex,follow"
      menuItems={menuItems}
      canonical={`${siteUrl(c.env)}${path}`}
    >
      <div class="content">
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
