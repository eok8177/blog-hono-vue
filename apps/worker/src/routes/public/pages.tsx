import type { Context, Hono } from 'hono';
import type { AppEnv } from '../../index';
import { renderMarkdown } from '../../utils/content';
import { Layout, Markdown } from '../../views/layout';
import { findRedirect, readNavigation, siteUrl } from './shared';

type Locale = 'uk' | 'en';

export function registerPageRoutes(app: Hono<AppEnv>) {
  app.get('/en/:slug', (c) => renderPage(c, 'en'));
  app.get('/:slug', (c) => renderPage(c, 'uk'));
}

async function renderPage(c: Context<AppEnv>, locale: Locale) {
  const page = await c.env.DB.prepare(
    `SELECT * FROM pages WHERE slug=? AND status='published'${locale === 'en' ? ' AND is_en_published=1' : ''}`,
  )
    .bind(c.req.param('slug') ?? '')
    .first<Record<string, unknown>>();
  if (!page) {
    const redirect = await findRedirect(c.env, c.req.path);
    return redirect && redirect.new_path !== c.req.path
      ? c.redirect(redirect.new_path, redirect.status_code)
      : c.notFound();
  }

  const title = String(page[locale === 'en' ? 'title_en' : 'title_uk']);
  const body = String(page[locale === 'en' ? 'body_md_en' : 'body_md_uk']);
  const base = siteUrl(c.env);
  const slug = c.req.param('slug') ?? '';
  const ukHref = `${base}/${slug}`;
  const enHref = `${base}/en/${slug}`;
  const hasEnglish = Number(page.is_en_published) === 1;
  const menuItems = await readNavigation(c.env, locale);

  const gallery = await c.env.DB.prepare(
    `SELECT m.id,m.width,m.height,m.alt_${locale} alt,m.caption_${locale} caption FROM page_media pm JOIN media m ON m.id=pm.media_id WHERE pm.page_id=? AND m.status='ready' ORDER BY pm.position`,
  )
    .bind(String(page.id))
    .all<{
      id: string;
      width: number;
      height: number;
      alt: string | null;
      caption: string | null;
    }>();

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
      <div class="content">
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
          {gallery.results.length ? (
            <section class="gallery" aria-label={locale === 'uk' ? 'Галерея' : 'Gallery'}>
              <h2>{locale === 'uk' ? 'Галерея' : 'Gallery'}</h2>
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
