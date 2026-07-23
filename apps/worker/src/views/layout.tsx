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
              <div class="nav-menu" id="nav-menu">
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
                  aria-controls="nav-menu"
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
          aria-modal="true"
          aria-label={lang === 'uk' ? 'Перегляд зображень' : 'Image viewer'}
          tabIndex={-1}
        >
          <div class="lightbox-backdrop" data-lightbox-close />
          <div class="lightbox-stage">
            <div class="lightbox-track" id="lightbox-track" />
          </div>
          <button class="lightbox-btn lightbox-close" type="button" data-lightbox-close aria-label={lang === 'uk' ? 'Закрити' : 'Close'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button class="lightbox-btn lightbox-prev" type="button" id="lightbox-prev" aria-label={lang === 'uk' ? 'Попереднє' : 'Previous'}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="lightbox-btn lightbox-next" type="button" id="lightbox-next" aria-label={lang === 'uk' ? 'Наступне' : 'Next'}>
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
              var scrollLockCount = 0;
              var previousOverflow = '';
              function lockScroll() {
                if (scrollLockCount++ === 0) previousOverflow = html.style.overflow;
                html.style.overflow = 'hidden';
              }
              function unlockScroll() {
                scrollLockCount = Math.max(0, scrollLockCount - 1);
                if (!scrollLockCount) html.style.overflow = previousOverflow;
              }

              var bar = doc.querySelector('.reading-progress');
              var ticking = false;
              if (bar) {
                function updateProgress() {
                  var el = doc.scrollingElement || html;
                  var st = el.scrollTop;
                  var sh = el.scrollHeight - el.clientHeight;
                  var pct = sh <= 0 ? 0 : Math.min(1, st / sh);
                  html.style.setProperty('--reading-progress', pct);
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
                  navMenu.classList.add('is-open');
                  lockScroll();
                  doc.addEventListener('keydown', onNavKey);
                }
                function closeNav() {
                  navToggle.setAttribute('aria-expanded', 'false');
                  navMenu.classList.remove('is-open');
                  unlockScroll();
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
                  var target = e.target;
                  if (target === navMenu || target instanceof Element && target.closest('.nav-menu-link')) {
                    closeNav();
                  }
                });
              }

              /* ── Lightbox ── */
              var lb = doc.getElementById('lightbox');
              var lbTrack = doc.getElementById('lightbox-track');
              var lbCounter = doc.getElementById('lightbox-counter');
              var lbCaption = doc.getElementById('lightbox-caption');
              var lbPrev = doc.getElementById('lightbox-prev');
              var lbNext = doc.getElementById('lightbox-next');
              var slides = [];
              var currentIdx = 0;
              var touchStartX = 0;
              var touchCurrentX = 0;
              var dragging = false;
              var animating = false;
              var transitionMs = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
              var slideEls = [];
              var galleryImages = [];
              var previousFocus = null;

              function buildSlides() {
                slides = [];
                galleryImages = Array.from(doc.querySelectorAll('.gallery img'));
                galleryImages.forEach(function(img) {
                  var fig = img.closest('figure');
                  var cap = fig ? fig.querySelector('figcaption') : null;
                  var src = img.getAttribute('src') || '';
                  slides.push({
                    src: src.replace(/\\/960$/, '/1600'),
                    alt: img.getAttribute('alt') || '',
                    caption: cap ? cap.textContent : ''
                  });
                });
              }

              function renderSlides() {
                if (!lbTrack) return;
                lbTrack.innerHTML = '';
                slideEls = slides.map(function(s, i) {
                  var slide = doc.createElement('div');
                  slide.className = 'lightbox-slide';
                  var img = doc.createElement('img');
                  img.setAttribute('data-src', s.src);
                  img.alt = s.alt;
                  img.decoding = 'async';
                  img.loading = i === currentIdx ? 'eager' : 'lazy';
                  slide.appendChild(img);
                  lbTrack.appendChild(slide);
                  return { slide: slide, img: img };
                });
                updateRenderedSlides();
              }

              function updateRenderedSlides() {
                slideEls.forEach(function(item, i) {
                  var nearby = Math.abs(i - currentIdx) <= 1;
                  item.slide.setAttribute('aria-hidden', i === currentIdx ? 'false' : 'true');
                  if (nearby && !item.img.getAttribute('src')) {
                    item.img.src = item.img.getAttribute('data-src') || '';
                  } else if (!nearby) {
                    item.img.removeAttribute('src');
                  }
                });
              }

              function goTo(idx) {
                if (idx < 0 || idx >= slides.length || animating) return;
                animating = true;
                currentIdx = idx;
                updateRenderedSlides();
                lbTrack.style.transform = 'translateX(-' + (idx * 100) + '%)';
                updateCounter();
                updateButtons();
                setTimeout(function(){ animating = false; }, transitionMs);
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
                var prev = lbPrev;
                var next = lbNext;
                if (prev) {
                  prev.disabled = slides.length < 2 || currentIdx === 0;
                  prev.hidden = slides.length < 2;
                }
                if (next) {
                  next.disabled = slides.length < 2 || currentIdx === slides.length - 1;
                  next.hidden = slides.length < 2;
                }
              }

              function open(idx) {
                if (!lb) return;
                if (!slides.length) return;
                currentIdx = Math.max(0, Math.min(idx, slides.length - 1));
                renderSlides();
                lbTrack.style.transition = 'none';
                lbTrack.style.transform = 'translateX(-' + (currentIdx * 100) + '%)';
                /* force reflow */
                lbTrack.offsetHeight;
                lbTrack.style.transition = 'transform ' + (transitionMs / 1000) + 's cubic-bezier(.4,0,.2,1)';
                updateCounter();
                updateButtons();
                lb.setAttribute('aria-hidden', 'false');
                lb.classList.add('is-open');
                previousFocus = doc.activeElement;
                lockScroll();
                lb.focus();
                doc.addEventListener('keydown', onKey);
              }

              function close() {
                if (!lb) return;
                lb.classList.remove('is-open');
                lb.setAttribute('aria-hidden', 'true');
                unlockScroll();
                doc.removeEventListener('keydown', onKey);
                if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
                previousFocus = null;
              }

              function onKey(e) {
                if (e.key === 'Escape') { close(); return; }
                if (e.key === 'ArrowLeft') { goTo(currentIdx - 1); return; }
                if (e.key === 'ArrowRight') { goTo(currentIdx + 1); return; }
                if (e.key === 'Tab' && lb) {
                  var focusable = Array.from(lb.querySelectorAll('button:not([hidden]):not([disabled])'));
                  if (!focusable.length) { e.preventDefault(); return; }
                  var first = focusable[0];
                  var last = focusable[focusable.length - 1];
                  if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
                  else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
                }
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
                  lbTrack.style.transition = 'transform ' + (transitionMs / 1000) + 's cubic-bezier(.4,0,.2,1)';
                  var dx = touchCurrentX - touchStartX;
                  if (dx < -40) { goTo(currentIdx + 1); }
                  else if (dx > 40) { goTo(currentIdx - 1); }
                  else { goTo(currentIdx); }
                });
              }

              /* ── Click handlers ── */
              doc.addEventListener('click', function(e) {
                var target = e.target;
                if (!(target instanceof Element)) return;
                /* open: click on gallery image */
                var galleryImg = target.closest('.gallery img');
                if (galleryImg) {
                  e.preventDefault();
                  buildSlides();
                  open(galleryImages.indexOf(galleryImg));
                  return;
                }
                /* close: backdrop or close button */
                if (target.hasAttribute('data-lightbox-close') || target.closest('[data-lightbox-close]')) {
                  close();
                  return;
                }
              });

              /* prev / next buttons */
              var prevBtn = lbPrev;
              var nextBtn = lbNext;
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
