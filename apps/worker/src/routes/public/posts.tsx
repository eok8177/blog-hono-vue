import type { Context, Hono } from 'hono';
import type { AppEnv } from '../../index';
import { findPost } from '../../services/posts';
import { renderMarkdown } from '../../utils/content';
import { Layout, Markdown } from '../../views/layout';
import { findRedirect, readNavigation, siteUrl } from './shared';

type Locale = 'uk' | 'en';

export function registerPostRoutes(app: Hono<AppEnv>) {
  app.get('/post/:slug', (c) => renderPost(c, 'uk'));
  app.get('/en/post/:slug', (c) => renderPost(c, 'en'));
}

async function renderPost(c: Context<AppEnv>, locale: Locale) {
  const post = await findPost(c.env, c.req.param('slug') ?? '', locale);
  if (!post) {
    const redirect = await findRedirect(c.env, c.req.path);
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
  const base = siteUrl(c.env);
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
      <div class="content">
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
