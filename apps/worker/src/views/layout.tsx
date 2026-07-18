import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
export const Layout: FC<{
  title: string;
  lang: 'uk' | 'en';
  description?: string;
  canonical?: string;
  alternates?: Array<{ lang: 'uk' | 'en' | 'x-default'; href: string }>;
  jsonLd?: Record<string, unknown>;
  robots?: string;
  languageHref?: string;
  children: unknown;
}> = ({
  title,
  lang,
  description,
  canonical,
  alternates,
  jsonLd,
  robots,
  languageHref,
  children,
}) => (
  <html lang={lang}>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={description ?? ''} />
      {robots ? <meta name="robots" content={robots} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {alternates?.map((alternate) => (
        <link rel="alternate" hrefLang={alternate.lang} href={alternate.href} />
      ))}
      <title>{title}</title>
      {jsonLd ? (
        <script type="application/ld+json">
          {raw(JSON.stringify(jsonLd).replaceAll('<', '\\u003c'))}
        </script>
      ) : null}
      <link rel="stylesheet" href="/assets/public.css" />
    </head>
    <body>
      <a class="wrap" href="#main">
        Перейти до вмісту
      </a>
      <header>
        <nav class="wrap" aria-label="Основна навігація">
          <a href="/">Архів фауни</a>
          <a href="/category/doslidzhennia">Дослідження</a>
          <a href="/search">Пошук</a>
          <a href={languageHref ?? (lang === 'uk' ? '/en/' : '/')}>
            {lang === 'uk' ? 'English' : 'Українська'}
          </a>
        </nav>
      </header>
      <main id="main" class="wrap">
        {children}
      </main>
      <footer class="wrap">Електронний архів · тестові матеріали</footer>
    </body>
  </html>
);
export const Markdown = ({ html }: { html: string }) => <div class="markdown">{raw(html)}</div>;
