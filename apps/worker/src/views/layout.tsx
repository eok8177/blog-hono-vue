import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
export const Layout: FC<{
  title: string;
  lang: 'uk' | 'en';
  nonce?: string;
  description?: string;
  canonical?: string;
  alternates?: Array<{ lang: 'uk' | 'en' | 'x-default'; href: string }>;
  jsonLd?: Record<string, unknown>;
  robots?: string;
  languageHref?: string;
  image?: string;
  type?: 'website' | 'article';
  children: unknown;
}> = ({
  title,
  lang,
  nonce,
  description,
  canonical,
  alternates,
  jsonLd,
  robots,
  languageHref,
  image,
  type = 'website',
  children,
}) => (
  <html lang={lang}>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={description ?? ''} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description ?? ''} />
      <meta property="og:type" content={type} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      {robots ? <meta name="robots" content={robots} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {alternates?.map((alternate) => (
        <link rel="alternate" hrefLang={alternate.lang} href={alternate.href} />
      ))}
      <title>{title}</title>
      {jsonLd ? (
        <script nonce={nonce} type="application/ld+json">
          {raw(JSON.stringify(jsonLd).replaceAll('<', '\\u003c'))}
        </script>
      ) : null}
      <link rel="stylesheet" href="/assets/public.css" />
    </head>
    <body>
      <a class="skip-link" href="#main">
        {lang === 'uk' ? 'Перейти до вмісту' : 'Skip to content'}
      </a>
      <header>
        <nav class="wrap" aria-label="Основна навігація">
          <a href={lang === 'uk' ? '/' : '/en/'}>
            {lang === 'uk' ? 'Архів фауни' : 'Fauna Archive'}
          </a>
          <a href={lang === 'uk' ? '/category/doslidzhennia' : '/en/category/doslidzhennia'}>
            {lang === 'uk' ? 'Дослідження' : 'Research'}
          </a>
          <a href={lang === 'uk' ? '/search' : '/en/search'}>
            {lang === 'uk' ? 'Пошук' : 'Search'}
          </a>
          <a href={languageHref ?? (lang === 'uk' ? '/en/' : '/')}>
            {lang === 'uk' ? 'English' : 'Українська'}
          </a>
        </nav>
      </header>
      <main id="main" class="wrap">
        {children}
      </main>
      <footer class="wrap">
        {lang === 'uk'
          ? 'Електронний архів · тестові матеріали'
          : 'Digital archive · research materials'}
      </footer>
    </body>
  </html>
);
export const Markdown = ({ html }: { html: string }) => <div class="markdown">{raw(html)}</div>;
