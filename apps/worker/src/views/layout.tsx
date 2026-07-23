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
            <div class="nav-group">
              <div class="nav-menu" id="nav-menu" aria-hidden="true">
                <div class="nav-menu-panel">
                  {menuItems.map((item) => (
                    <a class="nav-menu-link" href={item.href}>{item.label}</a>
                  ))}
                  <a class="nav-menu-link" href={lang === 'uk' ? '/search' : '/en/search'}>{copy.search}</a>
                </div>
              </div>
              <div class="nav-actions">
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
                <button
                  class="nav-toggle"
                  id="nav-toggle"
                  type="button"
                  aria-expanded="false"
                  aria-label={lang === 'uk' ? 'Меню' : 'Menu'}
                >
                  <span class="nav-toggle-icon" />
                </button>
              </div>
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
        <div
          class="lightbox"
          id="lightbox"
          aria-hidden="true"
          role="dialog"
          aria-label={lang === 'uk' ? 'Перегляд зображень' : 'Image viewer'}
        >
          <div class="lightbox-backdrop" data-lightbox-close />
          <div class="lightbox-stage">
            <div class="lightbox-track" id="lightbox-track" />
          </div>
          <button class="lightbox-btn lightbox-close" data-lightbox-close aria-label={lang === 'uk' ? 'Закрити' : 'Close'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button class="lightbox-btn lightbox-prev" id="lightbox-prev" aria-label={lang === 'uk' ? 'Попереднє' : 'Previous'}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="lightbox-btn lightbox-next" id="lightbox-next" aria-label={lang === 'uk' ? 'Наступне' : 'Next'}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div class="lightbox-counter" id="lightbox-counter" />
          <div class="lightbox-caption" id="lightbox-caption" />
        </div>
        <script nonce={nonce}>
          {raw(`
            ;(function(){
              var doc = document;
              var html = doc.documentElement;

              /* ── Reading progress ── */
              var bar = doc.querySelector('.reading-progress');
              var ticking = false;
              if (bar) {
                function updateProgress() {
                  var el = doc.scrollingElement || html;
                  var st = el.scrollTop;
                  var sh = el.scrollHeight - el.clientHeight;
                  var pct = sh <= 0 ? 0 : Math.min(100, Math.round((st / sh) * 1000) / 10);
                  html.style.setProperty('--reading-progress', pct + '%');
                }
                window.addEventListener('scroll', function(){
                  if (!ticking) { requestAnimationFrame(function(){ updateProgress(); ticking = false; }); ticking = true; }
                }, {passive: true});
                updateProgress();
              }

              /* ── Theme toggle ── */
              var toggle = doc.querySelector('.theme-toggle');
              if (toggle) {
                toggle.addEventListener('click', function(){
                  var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                  html.setAttribute('data-theme', next);
                  try { localStorage.setItem('theme', next); } catch(e) {}
                });
              }

              /* ── Mobile nav toggle ── */
              var navToggle = doc.getElementById('nav-toggle');
              var navMenu = doc.getElementById('nav-menu');
              if (navToggle && navMenu) {
                function openNav() {
                  navToggle.setAttribute('aria-expanded', 'true');
                  navMenu.setAttribute('aria-hidden', 'false');
                  navMenu.classList.add('is-open');
                  html.style.overflow = 'hidden';
                  doc.addEventListener('keydown', onNavKey);
                }
                function closeNav() {
                  navToggle.setAttribute('aria-expanded', 'false');
                  navMenu.setAttribute('aria-hidden', 'true');
                  navMenu.classList.remove('is-open');
                  html.style.overflow = '';
                  doc.removeEventListener('keydown', onNavKey);
                }
                function onNavKey(e) {
                  if (e.key === 'Escape') { closeNav(); navToggle.focus(); }
                }
                navToggle.addEventListener('click', function(e) {
                  e.stopPropagation();
                  if (navMenu.classList.contains('is-open')) { closeNav(); }
                  else { openNav(); }
                });
                navMenu.addEventListener('click', function(e) {
                  if (e.target === navMenu || e.target.closest('.nav-menu-link')) {
                    closeNav();
                  }
                });
              }

              /* ── Lightbox ── */
              var lb = doc.getElementById('lightbox');
              var lbTrack = doc.getElementById('lightbox-track');
              var lbCounter = doc.getElementById('lightbox-counter');
              var lbCaption = doc.getElementById('lightbox-caption');
              var slides = [];
              var currentIdx = 0;
              var touchStartX = 0;
              var touchCurrentX = 0;
              var dragging = false;
              var animating = false;

              function buildSlides() {
                slides = [];
                var figs = doc.querySelectorAll('.gallery figure');
                figs.forEach(function(fig) {
                  var img = fig.querySelector('img');
                  var cap = fig.querySelector('figcaption');
                  if (!img) return;
                  var src = img.getAttribute('src') || '';
                  var fullSrc = src.replace(/\\/960$/, '/1600');
                  var alt = img.getAttribute('alt') || '';
                  var caption = cap ? cap.textContent : '';
                  slides.push({ src: fullSrc, alt: alt, caption: caption });
                });
              }

              function renderSlides() {
                if (!lbTrack) return;
                lbTrack.innerHTML = '';
                slides.forEach(function(s, i) {
                  var slide = doc.createElement('div');
                  slide.className = 'lightbox-slide';
                  slide.setAttribute('aria-hidden', i === currentIdx ? 'false' : 'true');
                  var img = doc.createElement('img');
                  img.src = i === currentIdx || i === currentIdx - 1 || i === currentIdx + 1 ? s.src : '';
                  img.setAttribute('data-src', s.src);
                  img.alt = s.alt;
                  img.loading = 'lazy';
                  slide.appendChild(img);
                  lbTrack.appendChild(slide);
                });
              }

              function goTo(idx) {
                if (idx < 0 || idx >= slides.length || animating) return;
                animating = true;
                currentIdx = idx;
                renderSlides();
                lbTrack.style.transform = 'translateX(-' + (idx * 100) + '%)';
                updateCounter();
                updateButtons();
                setTimeout(function(){ animating = false; }, 350);
              }

              function updateCounter() {
                if (lbCounter && slides.length > 1) {
                  lbCounter.textContent = (currentIdx + 1) + ' / ' + slides.length;
                  lbCounter.style.display = 'block';
                } else if (lbCounter) {
                  lbCounter.style.display = 'none';
                }
                if (lbCaption) {
                  lbCaption.textContent = slides[currentIdx] ? slides[currentIdx].caption : '';
                  lbCaption.style.display = slides[currentIdx] && slides[currentIdx].caption ? 'block' : 'none';
                }
              }

              function updateButtons() {
                var prev = doc.getElementById('lightbox-prev');
                var next = doc.getElementById('lightbox-next');
                if (prev) prev.style.opacity = currentIdx === 0 ? '0.3' : '1';
                if (next) next.style.opacity = currentIdx === slides.length - 1 ? '0.3' : '1';
              }

              function open(idx) {
                if (!lb) return;
                buildSlides();
                if (!slides.length) return;
                currentIdx = Math.max(0, Math.min(idx, slides.length - 1));
                renderSlides();
                lbTrack.style.transition = 'none';
                lbTrack.style.transform = 'translateX(-' + (currentIdx * 100) + '%)';
                /* force reflow */
                lbTrack.offsetHeight;
                lbTrack.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1)';
                updateCounter();
                updateButtons();
                lb.setAttribute('aria-hidden', 'false');
                lb.classList.add('is-open');
                html.style.overflow = 'hidden';
                doc.addEventListener('keydown', onKey);
              }

              function close() {
                if (!lb) return;
                lb.classList.remove('is-open');
                lb.setAttribute('aria-hidden', 'true');
                html.style.overflow = '';
                doc.removeEventListener('keydown', onKey);
              }

              function onKey(e) {
                if (e.key === 'Escape') { close(); return; }
                if (e.key === 'ArrowLeft') { goTo(currentIdx - 1); return; }
                if (e.key === 'ArrowRight') { goTo(currentIdx + 1); return; }
              }

              /* ── Touch / swipe ── */
              if (lbTrack) {
                lbTrack.addEventListener('touchstart', function(e) {
                  if (animating || slides.length < 2) return;
                  touchStartX = e.touches[0].clientX;
                  touchCurrentX = touchStartX;
                  dragging = true;
                  lbTrack.style.transition = 'none';
                }, {passive: true});

                lbTrack.addEventListener('touchmove', function(e) {
                  if (!dragging) return;
                  touchCurrentX = e.touches[0].clientX;
                  var dx = touchCurrentX - touchStartX;
                  var offset = -currentIdx * 100 + (dx / lbTrack.offsetWidth) * 100;
                  /* clamp */
                  if (currentIdx === 0 && dx > 0) offset = Math.min(0, offset);
                  if (currentIdx === slides.length - 1 && dx < 0) offset = Math.max(-(slides.length - 1) * 100, offset);
                  lbTrack.style.transform = 'translateX(' + offset + '%)';
                }, {passive: true});

                lbTrack.addEventListener('touchend', function() {
                  if (!dragging) return;
                  dragging = false;
                  lbTrack.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1)';
                  var dx = touchCurrentX - touchStartX;
                  if (dx < -40) { goTo(currentIdx + 1); }
                  else if (dx > 40) { goTo(currentIdx - 1); }
                  else { goTo(currentIdx); }
                });
              }

              /* ── Click handlers ── */
              doc.addEventListener('click', function(e) {
                var target = e.target;
                /* open: click on gallery image */
                var galleryImg = target.closest('.gallery img');
                if (galleryImg) {
                  e.preventDefault();
                  buildSlides();
                  var idx = Array.from(doc.querySelectorAll('.gallery img')).indexOf(galleryImg);
                  open(idx);
                  return;
                }
                /* close: backdrop or close button */
                if (target.hasAttribute('data-lightbox-close') || target.closest('[data-lightbox-close]')) {
                  close();
                  return;
                }
              });

              /* prev / next buttons */
              var prevBtn = doc.getElementById('lightbox-prev');
              var nextBtn = doc.getElementById('lightbox-next');
              if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(currentIdx - 1); });
              if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(currentIdx + 1); });

              /* ── Table data-labels for mobile cards ── */
              var tables = doc.querySelectorAll('.markdown table');
              tables.forEach(function(table) {
                var headers = [];
                var ths = table.querySelectorAll('thead th');
                ths.forEach(function(th) { headers.push((th.textContent || '').trim()); });
                if (!headers.length) return;
                var rows = table.querySelectorAll('tbody tr');
                rows.forEach(function(tr) {
                  var tds = tr.querySelectorAll('td');
                  tds.forEach(function(td, i) {
                    if (headers[i]) td.setAttribute('data-label', headers[i]);
                  });
                });
              });
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
