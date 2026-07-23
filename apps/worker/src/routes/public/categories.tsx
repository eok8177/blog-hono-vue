import type { Context, Hono } from 'hono';
import { paginationSchema } from '@fauna/shared';
import type { AppEnv } from '../../index';
import { Layout } from '../../views/layout';
import { readNavigation, siteUrl } from './shared';

type Locale = 'uk' | 'en';

export function registerCategoryRoutes(app: Hono<AppEnv>) {
  app.get('/category/:slug', (c) => renderCategory(c, 'uk'));
  app.get('/en/category/:slug', (c) => renderCategory(c, 'en'));
}

async function renderCategory(c: Context<AppEnv>, locale: Locale) {
  const slug = c.req.param('slug') ?? '';
  const translation = locale === 'en' ? ' AND is_en_published=1' : '';
  const category = await c.env.DB.prepare(
    `SELECT * FROM categories WHERE slug=? AND status='published'${translation}`,
  )
    .bind(slug)
    .first<Record<string, unknown>>();
  if (!category) return c.notFound();

  const pagination = paginationSchema.parse(c.req.query());
  const postTranslation = locale === 'en' ? ' AND p.is_en_published=1' : '';
  const queries = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT p.slug,p.title_${locale} title,p.excerpt_${locale} excerpt,p.published_at FROM posts p JOIN post_categories pc ON pc.post_id=p.id WHERE pc.category_id=? AND p.status='published'${postTranslation} ORDER BY p.published_at DESC LIMIT ? OFFSET ?`,
    ).bind(category.id, pagination.pageSize, (pagination.page - 1) * pagination.pageSize),
    c.env.DB.prepare(
      `SELECT count(*) count FROM posts p JOIN post_categories pc ON pc.post_id=p.id WHERE pc.category_id=? AND p.status='published'${postTranslation}`,
    ).bind(category.id),
  ]);
  const basePath = locale === 'en' ? `/en/category/${slug}` : `/category/${slug}`;
  const suffix = pagination.page > 1 ? `?page=${pagination.page}` : '';
  const canonical = `${siteUrl(c.env)}${basePath}${suffix}`;
  const ukHref = `${siteUrl(c.env)}/category/${slug}${suffix}`;
  const enHref = `${siteUrl(c.env)}/en/category/${slug}${suffix}`;
  const hasEnglish = Number(category.is_en_published) === 1;
  const title = String(category[locale === 'en' ? 'title_en' : 'title_uk']);
  const menuItems = await readNavigation(c.env, locale);
  const total = (queries[1]!.results[0] as { count: number }).count;
  const pages = Math.max(1, Math.ceil(total / pagination.pageSize));
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
      <div class="content">
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
                    locale === 'en' ? `Read ${String(post.title)}` : `Читати ${String(post.title)}`
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
          {pagination.page > 1 ? (
            <a href={`${basePath}?page=${pagination.page - 1}`}>
              ← {locale === 'en' ? 'Previous' : 'Попередня'}
            </a>
          ) : (
            <span />
          )}
          {pagination.page < pages ? (
            <a href={`${basePath}?page=${pagination.page + 1}`}>
              {locale === 'en' ? 'Next' : 'Наступна'} →
            </a>
          ) : null}
        </nav>
      </div>
    </Layout>,
  );
}
