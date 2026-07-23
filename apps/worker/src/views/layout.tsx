import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';

import { labels } from './layout/i18n';
import { Head } from './layout/head';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { Lightbox } from './layout/lightbox';
import { inlineScript } from './layout/scripts';

export { Markdown } from './components/markdown';
export { SectionLabel } from './components/section-label';

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
  menuItems?: Array<{ label: string; href: string }>;
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
  menuItems = [],
  children,
}) => {
  const copy = labels[lang];
  return (
    <html lang={lang}>
      <Head
        title={title}
        nonce={nonce}
        description={description}
        canonical={canonical}
        alternates={alternates}
        jsonLd={jsonLd}
        robots={robots}
        image={image}
        type={type}
      />
      <body>
        <div class="reading-progress" aria-hidden="true" />
        <a class="skip-link" href="#main">
          {lang === 'uk' ? 'Перейти до вмісту' : 'Skip to content'}
        </a>
        <Header
          lang={lang}
          brand={copy.brand}
          search={copy.search}
          languageLabel={copy.language}
          languageHref={languageHref}
          menuItems={menuItems}
        />
        <main id="main">{children}</main>
        <Footer lang={lang} brand={copy.brand} footer={copy.footer} />
        <Lightbox lang={lang} />
        <script nonce={nonce}>
          {raw(inlineScript())}
        </script>
      </body>
    </html>
  );
};
