export const publicCss = String.raw`
/* ── Layers ── */
@layer reset, theme, base, layout, components, utils;

/* ══════════════════════════════════════════════════
   RESET
   ══════════════════════════════════════════════════ */
@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  img, picture, video, canvas, svg { display: block; max-width: 100%; }
  img { height: auto; }
  input, button, textarea, select { font: inherit; color: inherit; }
  button { cursor: pointer; }
  a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: .25em; }
  h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
  p { overflow-wrap: break-word; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

/* ══════════════════════════════════════════════════
   THEME — light & dark via OKLCH + light-dark()
   Single source of truth: no more triple-duplicated
   color blocks across prefers-color-scheme / data-theme.
   ══════════════════════════════════════════════════ */
@layer theme {
  :root {
    color-scheme: light dark;

    --bg:             light-dark(oklch(97.5% 0.006 90),        oklch(19% 0.012 95));
    --bg-card:        light-dark(oklch(100% 0 0),               oklch(23% 0.014 95));
    --bg-muted:       light-dark(oklch(95.5% 0.008 88),        oklch(25% 0.018 93));
    --fg:             light-dark(oklch(15% 0.01 90),           oklch(90% 0.01 95));
    --fg-muted:       light-dark(oklch(48% 0.02 85),           oklch(66% 0.025 90));
    /* Accent colors meet WCAG contrast for normal text on page backgrounds. */
    --accent:         light-dark(oklch(55% 0.15 78),           oklch(72% 0.14 80));
    --accent-hover:   light-dark(oklch(48% 0.14 78),           oklch(80% 0.11 80));
    --accent-soft:    light-dark(oklch(72% 0.10 80),           oklch(58% 0.10 80));
    --on-accent:      light-dark(oklch(100% 0 0),              oklch(16% 0.01 90));
    --border:         light-dark(oklch(90% 0.015 88),          oklch(30% 0.022 93));
    --border-light:   light-dark(oklch(93% 0.01 88),           oklch(26% 0.018 93));

    --shadow-sm:      light-dark(0 1px 2px oklch(15% 0.01 90 / .04),  0 1px 2px oklch(0% 0 0 / .25));
    --shadow-md:      light-dark(0 4px 16px oklch(15% 0.01 90 / .07), 0 4px 16px oklch(0% 0 0 / .35));
    --shadow-lg:      light-dark(0 12px 40px oklch(15% 0.01 90 / .10), 0 12px 40px oklch(0% 0 0 / .45));

    --radius-sm:      6px;
    --radius-md:      10px;

    --serif:          "Playfair Display", Georgia, "Times New Roman", serif;
    --sans:           "Source Sans 3", "Segoe UI", system-ui, -apple-system, sans-serif;
    --mono:           "IBM Plex Mono", "SF Mono", "Cascadia Code", Consolas, monospace;

    --header-h:       56px;
    --site-header-bg: light-dark(oklch(97.5% 0.006 90 / .82), oklch(19% 0.012 95 / .82));

    --reading-progress: 0;
  }

  @media (min-width: 700px) {
    :root { --header-h: 72px; }
  }

  /* manual theme override — color-scheme flips light-dark() resolution */
  [data-theme="dark"]  { color-scheme: dark; }
  [data-theme="light"] { color-scheme: light; }

  /* accessibility overrides */
  @media (prefers-contrast: more) {
    :root { --border: currentColor; --border-light: currentColor; }
  }
}

/* ══════════════════════════════════════════════════
   BASE
   ══════════════════════════════════════════════════ */
@layer base {
  html {
    accent-color: var(--accent);
    scrollbar-gutter: stable;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  body {
    color: var(--fg);
    background: var(--bg);
    font-family: var(--sans);
    font-size: 1.0625rem;
    line-height: 1.75;
    letter-spacing: .005em;
    min-height: 100vh;
  }

  /* ── subtle ambient gradient background ── */
  body::before {
    content: "";
    position: fixed;
    z-index: -1;
    inset: 0;
    pointer-events: none;
    opacity: .18;
    background:
      radial-gradient(ellipse 80% 60% at 50% -20%, oklch(72% 0.12 80 / .15), transparent),
      radial-gradient(ellipse 50% 40% at 80% 80%, oklch(55% 0.14 160 / .08), transparent),
      radial-gradient(ellipse 50% 50% at 20% 60%, oklch(50% 0.18 80 / .06), transparent);
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
  }

  /* ── links ── */
  a {
    color: var(--fg);
    transition: color .2s ease;
  }
  a:hover { color: var(--accent); }

  /* ── focus ring ── */
  :focus-visible {
    outline: 2.5px solid var(--accent);
    outline-offset: 3px;
    border-radius: 2px;
  }

  /* ── headings ── */
  h1, h2, h3, h4 {
    font-family: var(--serif);
    font-weight: 500;
    text-wrap: balance;
    line-height: 1.15;
  }

  /* ── selection ── */
  ::selection {
    background: oklch(62% 0.16 80 / .22);
    color: var(--fg);
  }

  /* ── scroll margin for anchor links (before sticky header) ── */
  :target {
    scroll-margin-block-start: calc(var(--header-h) + 2rem);
  }

  /* ── forced-colors mode ── */
  @media (forced-colors: active) {
    body::before { display: none; }
  }
}

/* ══════════════════════════════════════════════════
   LAYOUT
   ══════════════════════════════════════════════════ */
@layer layout {
  .container {
    width: min(100% - 2rem, 1120px);
    margin-inline: auto;
    @media (min-width: 600px) {
      width: min(100% - 3rem, 1120px);
    }
  }

  .content {
    width: min(100% - 2rem, 720px);
    margin-inline: auto;
    padding-block: clamp(3rem, 8vw, 6rem);
    @media (min-width: 600px) {
      width: min(100% - 3rem, 720px);
    }
  }

  main { min-height: 70vh; }
}

/* ══════════════════════════════════════════════════
   UTILS — small helpers
   ══════════════════════════════════════════════════ */
@layer utils {
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .small-caps, .section-label, .post-meta, .eyebrow, .pagination-label {
    font-family: var(--mono);
    font-size: .6875rem;
    font-weight: 500;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .empty-state {
    padding-block: 3rem;
    color: var(--fg-muted);
    text-wrap: pretty;
  }

  /* lazily-rendered off-screen content gets an intrinsic size hint
     so scrollbars/layout don't jump before it's measured */
  .lazy-render {
    content-visibility: auto;
    contain-intrinsic-size: auto 320px;
  }
}

/* ══════════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════════ */
@layer components {

  /* ── Reading progress bar (scroll-driven, no JS) ── */
  .reading-progress {
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: 30;
    height: 3px;
    background: var(--border-light);
    pointer-events: none;
  }
  .reading-progress::after {
    content: "";
    display: block;
    height: 100%;
    width: 100%;
    background: var(--accent);
    transform: scaleX(var(--reading-progress));
    transform-origin: left;
    transition: transform .1s linear;
  }
  /* progressive enhancement: native scroll-timeline where supported,
     falls back to the --reading-progress custom-property/JS approach */
  @supports (animation-timeline: scroll()) {
    .reading-progress::after {
      transform: none;
      transition: none;
      animation: reading-progress linear;
      animation-timeline: scroll(root);
    }
    @keyframes reading-progress {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
  }

  /* ── Skip link ── */
  .skip-link {
    position: absolute;
    left: 1rem;
    top: -4rem;
    z-index: 20;
    padding: .6rem 1.2rem;
    border-radius: var(--radius-sm);
    color: var(--bg);
    background: var(--fg);
    font-weight: 600;
    text-decoration: none;
    transition: top .2s ease;
  }
  .skip-link:focus { top: 1rem; }

  /* ── Site header ── */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--border);
    background: var(--site-header-bg);
    backdrop-filter: blur(14px) saturate(1.3);
    -webkit-backdrop-filter: blur(14px) saturate(1.3);
  }

  .site-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--header-h);
    gap: 1rem;
    padding-block: .5rem;
    @media (min-width: 700px) {
      min-height: 72px;
      padding-block: 0;
      gap: 2rem;
    }
  }

  /* nav group — menus + actions on the right */
  .nav-group {
    display: flex;
    align-items: center;
    gap: .6rem;
  }

  /* wordmark */
  .wordmark, .footer-wordmark {
    color: var(--fg);
    text-decoration: none;
  }
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: .65rem;
    line-height: 1.15;
  }
  .wordmark-mark {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    color: var(--accent);
    font-family: var(--serif);
    font-size: 1.25rem;
    font-style: italic;
    transition: background .2s ease, color .2s ease;
  }
  .wordmark:hover .wordmark-mark {
    background: var(--accent);
    color: var(--on-accent);
  }
  .wordmark strong {
    display: block;
    font-family: var(--serif);
    font-size: 1.05rem;
    font-weight: 600;
  }
  .wordmark small {
    display: block;
    margin-top: .2rem;
    color: var(--fg-muted);
    font-family: var(--mono);
    font-size: .5625rem;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  /* nav actions (theme, language, hamburger) */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: .6rem;
    flex-shrink: 0;
    @media (min-width: 700px) {
      gap: 1.2rem;
    }
  }
  .nav-actions .language-link {
    color: var(--fg-muted);
    font-size: .78rem;
    font-weight: 600;
    letter-spacing: .05em;
    text-decoration: none;
    transition: color .2s ease;
    @media (min-width: 700px) {
      padding-left: 1.2rem;
      border-left: 1px solid var(--border);
    }
  }
  .nav-actions .language-link:hover { color: var(--accent); }

  /* hamburger */
  .nav-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--fg);
    cursor: pointer;
    z-index: 60;
    position: relative;
    @media (min-width: 700px) {
      display: none;
    }
  }
  .nav-toggle-icon,
  .nav-toggle-icon::before,
  .nav-toggle-icon::after {
    display: block;
    width: 20px;
    height: 1.5px;
    background: var(--fg);
    border-radius: 1px;
    transition: transform .3s ease, top .3s ease, opacity .2s ease;
  }
  .nav-toggle-icon {
    position: relative;
    top: 0;
  }
  .nav-toggle-icon::before,
  .nav-toggle-icon::after {
    content: "";
    position: absolute;
    left: 0;
  }
  .nav-toggle-icon::before { top: -6px; }
  .nav-toggle-icon::after  { top: 6px; }

  .nav-toggle[aria-expanded="true"] .nav-toggle-icon {
    background: transparent;
  }
  .nav-toggle[aria-expanded="true"] .nav-toggle-icon::before {
    top: 0;
    transform: rotate(45deg);
  }
  .nav-toggle[aria-expanded="true"] .nav-toggle-icon::after {
    top: 0;
    transform: rotate(-45deg);
  }

  /* desktop nav menu (inline) */
  .nav-menu {
    display: none;
    @media (min-width: 700px) {
      display: flex;
      align-items: center;
      gap: 1.6rem;
    }
  }
  .nav-menu-panel {
    @media (min-width: 700px) {
      display: contents;
    }
  }
  .nav-menu-link {
    color: var(--fg-muted);
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .05em;
    text-decoration: none;
    transition: color .2s ease;
    white-space: nowrap;
  }
  .nav-menu-link:hover,
  .nav-menu-link[aria-current="page"] {
    color: var(--accent);
  }

  .nav-menu-link[aria-current="page"] {
    text-decoration: underline;
    text-decoration-color: var(--accent-soft);
    text-underline-offset: .45em;
  }

  /* mobile nav overlay */
  @media (max-width: 699px) {
    body.nav-open { overflow: hidden; }

    .nav-menu {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: block;
      overflow: hidden;
      visibility: hidden;
      transition: visibility .35s;
    }
    body.nav-open .nav-menu {
      visibility: visible;
      overflow: visible;
    }

    .nav-menu::before {
      content: "";
      position: absolute;
      inset: 0;
      background: oklch(0% 0 0 / .5);
      opacity: 0;
      transition: opacity .35s ease;
    }
    body.nav-open .nav-menu::before {
      opacity: 1;
    }

    /* prevent backdrop-filter on header from trapping fixed .nav-menu (Safari) */
    body.nav-open .site-header {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .nav-menu-panel {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      height: 100dvh;
      width: min(75vw, 320px);
      display: flex;
      flex-direction: column;
      gap: .5rem;
      padding: 5rem 1.5rem 2rem;
      background: var(--bg);
      border-left: 1px solid var(--border);
      transform: translateX(100%);
      transition: transform .35s cubic-bezier(.4,0,.2,1);
      overflow-y: auto;
    }
    body.nav-open .nav-menu-panel {
      transform: translateX(0);
    }

    .nav-menu-link {
      display: block;
      padding: .75rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--fg);
      font-size: 1.05rem;
      font-weight: 500;
      letter-spacing: .02em;
      text-decoration: none;
      transition: background .2s ease, color .2s ease, padding-left .2s ease;
    }
    .nav-menu-link:hover,
    .nav-menu-link:active {
      color: var(--accent);
      background: var(--bg-muted);
      padding-left: 1.35rem;
    }
  }

  /* ── Theme toggle ── */
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: transparent;
    color: var(--fg-muted);
    cursor: pointer;
    transition: border-color .2s ease, color .2s ease, background .2s ease;
    flex-shrink: 0;
  }
  .theme-toggle:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: oklch(62% 0.16 80 / .08);
  }
  .theme-toggle-icon {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: inset -4px -1px 0 0 var(--bg);
    transition: box-shadow .3s ease, transform .3s ease;
  }
  [data-theme="dark"] .theme-toggle-icon {
    box-shadow: inset 0 0 0 7px currentColor, inset 0 0 0 10px var(--bg);
    transform: scale(.75);
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    padding-block: clamp(4rem, 10vw, 8rem);
    overflow: hidden;
  }
  .hero-inner {
    width: min(100% - 2rem, 880px);
    margin-inline: auto;
    text-align: center;
    @media (min-width: 600px) {
      width: min(100% - 3rem, 880px);
    }
  }
  .hero h1 {
    max-width: 850px;
    margin-inline: auto;
    margin-bottom: 1.5rem;
    font-family: var(--serif);
    font-size: clamp(2.4rem, 6vw, 5rem);
    font-weight: 400;
    letter-spacing: -.04em;
    line-height: 1.08;
    text-wrap: balance;
  }
  .hero h1 em {
    color: var(--accent);
    font-style: italic;
  }
  .hero-intro {
    max-width: 600px;
    margin-inline: auto;
    color: var(--fg-muted);
    font-size: clamp(1rem, 1.8vw, 1.2rem);
    line-height: 1.8;
    text-wrap: pretty;
  }
  .hero-rule {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 500px;
    margin: 2.5rem auto 0;
    color: var(--accent);
    font-family: var(--serif);
    font-style: italic;
  }
  .hero-rule::before,
  .hero-rule::after {
    content: "";
    height: 1px;
    flex: 1;
    background: var(--border);
  }
  .eyebrow {
    margin-bottom: 1.2rem;
    color: var(--accent);
  }

  /* hero decorative orbits */
  .hero-orbit {
    position: absolute;
    width: 16rem;
    height: 16rem;
    border: 1px solid oklch(62% 0.16 80 / .14);
    border-radius: 50%;
    pointer-events: none;
    @media (min-width: 760px) {
      width: 18rem;
      height: 18rem;
    }
  }
  .hero-orbit::after {
    content: "";
    position: absolute;
    inset: 1.5rem;
    border: 1px solid oklch(62% 0.16 80 / .10);
    border-radius: 50%;
    @media (min-width: 760px) {
      inset: 1.8rem;
    }
  }
  .hero-orbit-left  {
    top: 10%;
    left: -9rem;
    @media (min-width: 760px) { left: -10rem; }
  }
  .hero-orbit-right {
    right: -10rem;
    bottom: 2%;
    @media (min-width: 760px) { right: -11rem; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .hero-orbit { transition: transform .6s ease; }
  }

  /* ── Sections ── */
  .section {
    padding-block: clamp(3.5rem, 8vw, 7rem);
    border-top: 1px solid var(--border);
    content-visibility: auto;
    contain-intrinsic-size: auto 600px;
  }
  .section-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2.2rem;
    color: var(--accent);
  }
  .section-label > span:first-child,
  .section-label > span:last-child {
    height: 1px;
    flex: 1;
    background: var(--border);
  }
  .section-heading {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2.2rem;
    @media (min-width: 700px) {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2rem;
    }
  }
  .section-heading h2 {
    max-width: 620px;
    font-family: var(--serif);
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 400;
    letter-spacing: -.025em;
    line-height: 1.2;
    text-wrap: balance;
  }
  .section-heading p {
    max-width: 360px;
    color: var(--fg-muted);
    text-wrap: pretty;
  }

  /* ── Cards (archive grid) ── */
  .archive-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    @media (min-width: 540px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    @media (min-width: 900px) {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
  }

  .card {
    container-type: inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 1.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    box-shadow: var(--shadow-sm);
    content-visibility: auto;
    contain-intrinsic-size: auto 280px;
    transition:
      border-color .25s ease,
      box-shadow .25s ease,
      transform .25s ease,
      background .25s ease;
    @media (min-width: 600px) {
      padding: 2rem;
    }
  }
  .card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 1.5rem;
    right: 1.5rem;
    height: 2px;
    background: var(--accent);
    border-radius: 0 0 2px 2px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform .3s ease;
  }
  .card:hover,
  .card:focus-within {
    border-color: var(--accent-soft);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  .card:hover::before,
  .card:focus-within::before {
    transform: scaleX(1);
  }
  .card .post-meta {
    margin-bottom: 1rem;
    color: var(--accent);
  }
  .card h2, .card h3 {
    margin-bottom: .65rem;
    font-family: var(--serif);
    font-weight: 600;
    line-height: 1.3;
  }
  .card h2 { font-size: 1.25rem; }
  .card h3 { font-size: 1.1rem; }
  .card h2 a, .card h3 a { text-decoration: none; }
  .card h2 a:hover, .card h3 a:hover { color: var(--accent); }
  .card p {
    color: var(--fg-muted);
    line-height: 1.7;
    text-wrap: pretty;
  }
  .card .read-more {
    margin-top: auto;
    padding-top: 1.2rem;
    font-size: .75rem;
    font-weight: 600;
    letter-spacing: .07em;
    text-decoration: none;
    color: var(--fg);
    transition: color .2s ease;
  }
  .card .read-more::after {
    content: "  ↗";
    color: var(--accent);
  }
  .card .read-more:hover { color: var(--accent); }

  /* ── Archive note (categories section) ── */
  .archive-note {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    align-items: center;
    @media (min-width: 700px) {
      grid-template-columns: 1.2fr .8fr;
      gap: 4rem;
    }
  }
  .archive-note h2 {
    font-family: var(--serif);
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 400;
    line-height: 1.15;
    text-wrap: balance;
  }
  .archive-note p { color: var(--fg-muted); }
  .note-mark {
    border-top: 1px solid var(--accent);
    padding-top: 1.2rem;
    color: var(--fg-muted);
    font-family: var(--mono);
    font-size: .6875rem;
    letter-spacing: .1em;
    line-height: 1.8;
    text-transform: uppercase;
  }

  /* ── Text link (categories) ── */
  .text-link {
    display: inline-block;
    padding-block: .35rem;
    color: var(--fg);
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .07em;
    text-decoration: none;
    transition: color .2s ease;
  }
  .text-link::after {
    content: "  →";
    color: var(--accent);
  }
  .text-link:hover { color: var(--accent); }

  /* ── Post page ── */
  .breadcrumb {
    margin-bottom: 2rem;
    color: var(--fg-muted);
    font-family: var(--mono);
    font-size: .625rem;
    letter-spacing: .09em;
    text-transform: uppercase;
  }
  .breadcrumb a {
    color: var(--fg-muted);
    text-decoration: none;
    transition: color .2s ease;
  }
  .breadcrumb a:hover { color: var(--accent); }

  .page-title {
    max-width: 840px;
    margin-bottom: 1rem;
    font-family: var(--serif);
    font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: 400;
    letter-spacing: -.035em;
    line-height: 1.1;
    text-wrap: balance;
  }
  .lede {
    max-width: 680px;
    color: var(--fg-muted);
    font-size: 1.1rem;
    line-height: 1.8;
    text-wrap: pretty;
  }
  .post-header {
    padding-bottom: 2.5rem;
    border-bottom: 1px solid var(--border);
  }
  .post-meta {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem 1.4rem;
    margin-bottom: 1.2rem;
    color: var(--accent);
  }

  .post-body {
    margin: 2.5rem auto 0;
  }

  /* ── Markdown content ── */
  .markdown {
    color: var(--fg);
    font-size: 1.05rem;
    line-height: 1.85;
    text-wrap: pretty;
  }
  .markdown h1, .markdown h2, .markdown h3, .markdown h4 {
    margin-block: 2.5rem 1rem;
    color: var(--fg);
    font-family: var(--serif);
    font-weight: 500;
    line-height: 1.25;
    scroll-margin-block-start: calc(var(--header-h) + 2rem);
  }
  .markdown h1 { font-size: 2rem; }
  .markdown h2 { font-size: 1.6rem; }
  .markdown h3 { font-size: 1.25rem; }
  .markdown p  { margin-bottom: 1.5rem; }
  .markdown a  {
    color: var(--accent);
    overflow-wrap: anywhere;
    text-underline-offset: .2em;
  }
  .markdown a:hover { color: var(--accent-hover); }
  .markdown blockquote {
    margin: 2rem 0;
    padding: 1.2rem 1.5rem;
    border-left: 3px solid var(--accent);
    background: var(--bg-muted);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    color: var(--fg-muted);
    font-family: var(--serif);
    font-size: 1.25rem;
    font-style: italic;
  }
  .markdown ul, .markdown ol {
    margin-bottom: 1.5rem;
    padding-left: 1.5rem;
  }
  .markdown li { margin-bottom: .5rem; }
  .markdown img {
    max-width: 100%;
    height: auto;
    margin-inline: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .markdown figure { margin-block: 2rem; }
  .markdown figcaption {
    margin-top: .6rem;
    color: var(--fg-muted);
    font-size: .85rem;
    text-align: center;
  }
  .markdown code {
    padding: .15em .4em;
    background: var(--bg-muted);
    border-radius: 4px;
    font-family: var(--mono);
    font-size: .82em;
  }
  .markdown pre {
    margin-bottom: 1.5rem;
    padding: 1.2rem 1.5rem;
    background: var(--bg-muted);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow-x: auto;
    tab-size: 2;
  }
  .markdown pre code {
    padding: 0;
    background: none;
    font-size: .85em;
    overflow-wrap: normal;
    white-space: pre;
  }
  .markdown hr {
    margin: 2.5rem 0;
    border: none;
    height: 1px;
    background: var(--border);
  }
  .markdown table {
    width: 100%;
    margin-bottom: 1.5rem;
    border-collapse: collapse;
  }
  .markdown th, .markdown td {
    padding: .75rem 1rem;
    border: 1px solid var(--border);
    text-align: left;
  }
  .markdown th {
    background: var(--bg-muted);
    font-weight: 600;
  }

  /* ── Table · mobile cards ── */
  @media (max-width: 699px) {
    .markdown table,
    .markdown thead,
    .markdown tbody,
    .markdown tr,
    .markdown th,
    .markdown td {
      display: block;
      width: 100%;
    }
    .markdown thead { display: none; }
    .markdown table { border-collapse: separate; }

    .markdown tbody tr {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      background: var(--bg-card);
      overflow: hidden;
    }

    .markdown td {
      display: flex;
      flex-direction: column;
      gap: .2rem;
      padding: .65rem 1rem;
      border: none;
      border-bottom: 1px solid var(--border-light);
      text-align: left;
    }
    .markdown td::before {
      content: attr(data-label);
      font-weight: 600;
      font-size: .72em;
      color: var(--fg-muted);
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .markdown td:last-child { border-bottom: none; }
    .markdown tbody tr:last-child { margin-bottom: 0; }
  }

  /* ── Gallery ── */
  .gallery {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }
  .gallery h2 {
    margin-bottom: 1.5rem;
    font-family: var(--serif);
    font-size: 1.8rem;
    font-weight: 400;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    @media (min-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
  }
  .gallery figure {
    margin: 0;
    content-visibility: auto;
    contain-intrinsic-size: auto 260px;
  }
  .gallery img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-muted);
    aspect-ratio: 3 / 2;
    object-fit: cover;
    cursor: zoom-in;
    transition: opacity .2s ease;
  }
  .gallery figcaption {
    padding-top: .5rem;
    color: var(--fg-muted);
    font-size: .85rem;
  }
  .gallery img:hover { opacity: .85; }

  /* ── Lightbox ── */
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: oklch(0% 0 0 / .92);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity .3s ease,
      visibility 0s linear .3s;
  }
  .lightbox.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0s;
  }

  body.lightbox-open,
  body:has(.lightbox.is-open) {
    overflow: hidden;
  }
  .lightbox-backdrop {
    position: absolute;
    inset: 0;
    cursor: pointer;
  }

  /* stage */
  .lightbox-stage {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lightbox-track {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    transition: transform .35s cubic-bezier(.4,0,.2,1);
    will-change: transform;
  }
  .lightbox-slide {
    flex: 0 0 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .lightbox-slide img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 2px;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
  }

  /* buttons */
  .lightbox-btn {
    position: absolute;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: oklch(100% 0 0 / .12);
    color: #fff;
    cursor: pointer;
    transition: background .2s ease, opacity .2s ease;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
  .lightbox-btn:hover { background: oklch(100% 0 0 / .25); }
  .lightbox-btn:disabled {
    opacity: .3;
    cursor: default;
  }
  .lightbox-btn:disabled:hover { background: oklch(100% 0 0 / .12); }
  .lightbox-close { top: 1rem; right: 1rem; }
  .lightbox-prev {
    left: .75rem;
    top: 50%;
    transform: translateY(-50%);
    @media (min-width: 600px) { left: 1.5rem; }
  }
  .lightbox-next {
    right: .75rem;
    top: 50%;
    transform: translateY(-50%);
    @media (min-width: 600px) { right: 1.5rem; }
  }

  /* counter */
  .lightbox-counter {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: .35rem .85rem;
    border-radius: 20px;
    background: oklch(100% 0 0 / .12);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #fff;
    font-family: var(--mono);
    font-size: .75rem;
    letter-spacing: .08em;
  }

  /* caption */
  .lightbox-caption {
    position: absolute;
    bottom: 3.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    max-width: 600px;
    padding: .5rem 1rem;
    border-radius: 6px;
    background: oklch(0% 0 0 / .55);
    color: oklch(95% 0 0);
    font-size: .9rem;
    text-align: center;
    text-wrap: balance;
  }

  /* ── Listing (category / search results) ── */
  .listing-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
    @media (min-width: 700px) {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2rem;
    }
  }
  .listing-header h1 {
    font-family: var(--serif);
    font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: 400;
    letter-spacing: -.035em;
    line-height: 1.1;
  }
  .listing-header p {
    max-width: 390px;
    color: var(--fg-muted);
    text-wrap: pretty;
  }

  .post-list {
    margin-top: 2rem;
    border-top: 1px solid var(--border);
  }
  .listing-card {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: .5rem 1rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--border);
    content-visibility: auto;
    contain-intrinsic-size: auto 140px;
    transition: background .2s ease;
    @media (min-width: 600px) {
      grid-template-columns: 140px 1fr auto;
      gap: 1.5rem;
      padding: 1.8rem 0;
    }
  }
  .listing-card:hover,
  .listing-card:focus-within {
    background: color-mix(in oklch, var(--bg-muted) 45%, transparent);
  }
  .listing-card .post-meta {
    margin: .2rem 0 0;
    grid-row: 1;
    @media (min-width: 600px) { grid-row: auto; }
  }
  .listing-card > div {
    grid-column: 1;
    @media (min-width: 600px) { grid-column: auto; }
  }
  .listing-card h2 {
    margin-bottom: .4rem;
    font-family: var(--serif);
    font-size: 1.3rem;
    font-weight: 500;
    line-height: 1.3;
    @media (min-width: 600px) { font-size: 1.45rem; }
  }
  .listing-card h2 a { text-decoration: none; }
  .listing-card p {
    max-width: 570px;
    color: var(--fg-muted);
    text-wrap: pretty;
  }
  .listing-card:focus-within .listing-arrow {
    transform: translateX(.2rem);
  }

  .listing-arrow {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    color: var(--accent);
    font-size: 1.2rem;
    transition: transform .2s ease;
    @media (min-width: 600px) {
      grid-column: auto;
      grid-row: auto;
    }
  }

  /* ── Pagination ── */
  .pagination {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2.5rem;
  }
  .pagination a {
    color: var(--fg);
    font-size: .78rem;
    font-weight: 600;
    letter-spacing: .07em;
    text-decoration: none;
    transition: color .2s ease;
  }
  .pagination a:hover { color: var(--accent); }

  /* ── Search ── */
  .search-form {
    display: flex;
    gap: .75rem;
    margin-block: 2rem 3rem;
  }
  .search-form label { flex: 1; }
  .search-input {
    width: 100%;
    height: 48px;
    padding: .6rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--fg);
    background: var(--bg-card);
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .search-input::placeholder { color: var(--fg-muted); }
  .search-input:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
    outline: none;
  }
  .search-results {
    display: grid;
    gap: .75rem;
  }

  /* ── Button ── */
  .button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: .65rem 1.3rem;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    color: var(--on-accent);
    background: var(--accent);
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .05em;
    text-decoration: none;
    transition: background .2s ease, transform .2s ease, box-shadow .2s ease;
  }
  .button:hover {
    color: var(--on-accent);
    background: var(--accent-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  /* ── Footer ── */
  .site-footer {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-block: 2rem;
    border-top: 1px solid var(--border);
    color: var(--fg-muted);
    @media (min-width: 600px) {
      flex-direction: row;
      justify-content: space-between;
      gap: 2rem;
    }
  }
  .footer-wordmark {
    font-family: var(--serif);
    font-size: 1.1rem;
  }
  .site-footer p {
    margin-top: .2rem;
    font-size: .85rem;
    text-wrap: pretty;
  }
  .footer-meta {
    display: flex;
    align-items: center;
    gap: .75rem;
    font-size: .7rem;
  }
  .footer-rule {
    width: 40px;
    height: 1px;
    background: var(--border);
  }

  /* ── View transitions (opt-in) ── */
  @media (prefers-reduced-motion: no-preference) {
    @view-transition {
      navigation: auto;
    }
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation-duration: .25s;
    }
  }
}

/* ══════════════════════════════════════════════════
   PRINT STYLES
   ══════════════════════════════════════════════════ */
@media print {
  @layer base {
    body {
      color: #000;
      background: #fff;
      font-size: 12pt;
      line-height: 1.5;
    }
    body::before { display: none; }
    .site-header, .site-footer, .skip-link, .reading-progress,
    .hero-orbit, .gallery, .pagination, .search-form,
    .button, .breadcrumb, .post-meta {
      display: none;
    }
    main { min-height: auto; }
    .container, .content {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
    .card, .listing-card {
      border: 1px solid #ccc;
      box-shadow: none;
      break-inside: avoid;
      page-break-inside: avoid;
      content-visibility: visible;
    }
    .markdown a { color: #000; text-decoration: underline; }
    .markdown a[href^="http"]::after {
      content: " (" attr(href) ")";
      font-size: .8em;
      color: #555;
      overflow-wrap: anywhere;
    }
    .markdown img { max-width: 100% !important; page-break-inside: avoid; }
    .markdown pre, .markdown blockquote {
      border: 1px solid #ccc;
      background: #f8f8f8;
    }
  }
}
`;
