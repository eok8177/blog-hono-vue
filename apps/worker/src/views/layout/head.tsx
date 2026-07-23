import { raw } from 'hono/html';
import type { FC } from 'hono/jsx';

export const Head: FC<{
  title: string;
  nonce?: string | undefined;
  description?: string | undefined;
  canonical?: string | undefined;
  alternates?: Array<{ lang: 'uk' | 'en' | 'x-default'; href: string }> | undefined;
  jsonLd?: Record<string, unknown> | undefined;
  robots?: string | undefined;
  image?: string | undefined;
  type?: 'website' | 'article';
}> = ({ title, nonce, description, canonical, alternates, jsonLd, robots, image, type = 'website' }) => {
  return (
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={description ?? ''} />
      <meta name="theme-color" content="#fafaf8" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#2a2820" media="(prefers-color-scheme: dark)" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description ?? ''} />
      <meta property="og:type" content={type} />
      {image ? <meta property="og:image" content={image} /> : null}
      {image ? <meta property="og:image:width" content="1200" /> : null}
      {image ? <meta property="og:image:height" content="630" /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      <meta name="twitter:site" content="@fauna_archive" />
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
      <script nonce={nonce}>
        {raw(`
          ;(function(){
            var t = null;
            try { t = localStorage.getItem('theme'); } catch(e) {}
            if (t === 'dark' || t === 'light') {
              document.documentElement.setAttribute('data-theme', t);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.setAttribute('data-theme', 'light');
            }
          })();
        `)}
      </script>
      <link rel="stylesheet" href="/assets/public.css" />
    </head>
  );
};
