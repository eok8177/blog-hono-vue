import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';

const labels = {
  uk: {
    brand: 'Архів фауни',
    search: 'Пошук',
    language: 'English',
    breadcrumb: 'Навігація шляхом',
    footer: 'Електронний архів · польові нотатки та дослідження',
  },
  en: {
    brand: 'Fauna Archive',
    search: 'Search',
    language: 'Українська',
    breadcrumb: 'Breadcrumb',
    footer: 'Digital archive · field notes and research',
  },
} as const;

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
              var t = localStorage.getItem('theme');
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
      <body>
        <div class="reading-progress" aria-hidden="true" />
        <a class="skip-link" href="#main">
          {lang === 'uk' ? 'Перейти до вмісту' : 'Skip to content'}
        </a>
        <header class="site-header">
          <nav
            class="site-nav container"
            aria-label={lang === 'uk' ? 'Основна навігація' : 'Primary navigation'}
          >
            <a class="wordmark" href={lang === 'uk' ? '/' : '/en/'}>
              <span class="wordmark-mark" aria-hidden="true">
                F
              </span>
              <span>
                <strong>{copy.brand}</strong>
                <small>{lang === 'uk' ? 'південь України' : 'southern Ukraine'}</small>
              </span>
            </a>
            <div class="nav-links">
              {menuItems.map((item) => (
                <a href={item.href}>{item.label}</a>
              ))}
              <a href={lang === 'uk' ? '/search' : '/en/search'}>{copy.search}</a>
              <button
                class="theme-toggle"
                type="button"
                aria-label={lang === 'uk' ? 'Перемкнути тему' : 'Toggle theme'}
                title={lang === 'uk' ? 'Перемкнути тему' : 'Toggle theme'}
              >
                <span class="theme-toggle-icon" aria-hidden="true" />
              </button>
              <a class="language-link" href={languageHref ?? (lang === 'uk' ? '/en/' : '/')}>
                {copy.language}
              </a>
            </div>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer class="site-footer container">
          <div>
            <a class="footer-wordmark" href={lang === 'uk' ? '/' : '/en/'}>
              {copy.brand}
            </a>
            <p>{copy.footer}</p>
          </div>
          <div class="footer-meta">
            <span class="small-caps">
              {lang === 'uk' ? 'Південна Україна' : 'Southern Ukraine'}
            </span>
            <span class="footer-rule" aria-hidden="true" />
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
        <script nonce={nonce}>
          {raw(`
            ;(function(){
              var bar = document.querySelector('.reading-progress');
              if (!bar) return;
              var ticking = false;
              function update() {
                var el = document.scrollingElement || document.documentElement;
                var st = el.scrollTop;
                var sh = el.scrollHeight - el.clientHeight;
                var pct = sh <= 0 ? 0 : Math.min(100, Math.round((st / sh) * 1000) / 10);
                document.documentElement.style.setProperty('--reading-progress', pct + '%');
              }
              window.addEventListener('scroll', function(){
                if (!ticking) { requestAnimationFrame(function(){ update(); ticking = false; }); ticking = true; }
              }, {passive: true});
              update();

              var toggle = document.querySelector('.theme-toggle');
              if (toggle) {
                toggle.addEventListener('click', function(){
                  var h = document.documentElement;
                  var next = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                  h.setAttribute('data-theme', next);
                  try { localStorage.setItem('theme', next); } catch(e) {}
                });
              }
            })();
          `)}
        </script>
      </body>
    </html>
  );
};

export const Markdown = ({ html }: { html: string }) => <div class="markdown">{raw(html)}</div>;

export const SectionLabel = ({ children }: { children: unknown }) => (
  <div class="section-label">
    <span aria-hidden="true" />
    <span>{children}</span>
    <span aria-hidden="true" />
  </div>
);
