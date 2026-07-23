export const publicCss = String.raw`
/* ── Layers ── */
@layer reset, base, layout, components, utils, theme;

/* ══════════════════════════════════════════════════
   UNLAYERED — must resolve across all layers
   ══════════════════════════════════════════════════ */
:root {
  --reading-progress: 0%;
}

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
   THEME — light & dark via OKLCH
   ══════════════════════════════════════════════════ */
@layer theme {
  :root {
    /* light */
    --bg:            oklch(97.5% 0.006 90);
    --bg-card:       oklch(100% 0 0);
    --bg-muted:      oklch(95.5% 0.008 88);
    --fg:            oklch(15% 0.01 90);
    --fg-muted:      oklch(48% 0.02 85);
    --accent:        oklch(62% 0.16 80);
    --accent-soft:   oklch(72% 0.12 80);
    --border:        oklch(90% 0.015 88);
    --border-light:  oklch(93% 0.01 88);

    --shadow-sm:     0 1px 2px oklch(15% 0.01 90 / .04);
    --shadow-md:     0 4px 16px oklch(15% 0.01 90 / .07);
    --shadow-lg:     0 12px 40px oklch(15% 0.01 90 / .10);

    --radius-sm:     6px;
    --radius-md:     10px;

    --serif:         "Playfair Display", Georgia, "Times New Roman", serif;
    --sans:          "Source Sans 3", "Segoe UI", system-ui, -apple-system, sans-serif;
    --mono:          "IBM Plex Mono", "SF Mono", "Cascadia Code", Consolas, monospace;

    --header-h:      56px;
    --site-header-bg: oklch(97.5% 0.006 90 / .82);
  }

  /* dark */
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:            oklch(19% 0.012 95);
      --bg-card:       oklch(23% 0.014 95);
      --bg-muted:      oklch(25% 0.018 93);
      --fg:            oklch(90% 0.01 95);
      --fg-muted:      oklch(66% 0.025 90);
      --accent:        oklch(68% 0.16 80);
      --accent-soft:   oklch(58% 0.12 80);
      --border:        oklch(30% 0.022 93);
      --border-light:  oklch(26% 0.018 93);

      --shadow-sm:     0 1px 2px oklch(0% 0 0 / .25);
      --shadow-md:     0 4px 16px oklch(0% 0 0 / .35);
      --shadow-lg:     0 12px 40px oklch(0% 0 0 / .45);

      --site-header-bg: oklch(19% 0.012 95 / .82);
    }
  }

  /* manual dark toggle via <html data-theme="dark"> */
  [data-theme="dark"] {
    --bg:            oklch(19% 0.012 95);
    --bg-card:       oklch(23% 0.014 95);
    --bg-muted:      oklch(25% 0.018 93);
    --fg:            oklch(90% 0.01 95);
    --fg-muted:      oklch(66% 0.025 90);
    --accent:        oklch(68% 0.16 80);
    --accent-soft:   oklch(58% 0.12 80);
    --border:        oklch(30% 0.022 93);
    --border-light:  oklch(26% 0.018 93);
    --shadow-sm:     0 1px 2px oklch(0% 0 0 / .25);
    --shadow-md:     0 4px 16px oklch(0% 0 0 / .35);
    --shadow-lg:     0 12px 40px oklch(0% 0 0 / .45);
    --site-header-bg: oklch(19% 0.012 95 / .82);
  }

  /* forced-light override */
  [data-theme="light"] {
    --bg:            oklch(97.5% 0.006 90);
    --bg-card:       oklch(100% 0 0);
    --bg-muted:      oklch(95.5% 0.008 88);
    --fg:            oklch(15% 0.01 90);
    --fg-muted:      oklch(48% 0.02 85);
    --accent:        oklch(62% 0.16 80);
    --accent-soft:   oklch(72% 0.12 80);
    --border:        oklch(90% 0.015 88);
    --border-light:  oklch(93% 0.01 88);
    --shadow-sm:     0 1px 2px oklch(15% 0.01 90 / .04);
    --shadow-md:     0 4px 16px oklch(15% 0.01 90 / .07);
    --shadow-lg:     0 12px 40px oklch(15% 0.01 90 / .10);
    --site-header-bg: oklch(97.5% 0.006 90 / .82);
  }
}

/* ══════════════════════════════════════════════════
   BASE
   ══════════════════════════════════════════════════ */
@layer base {
  html {
    color-scheme: light dark;
    accent-color: var(--accent);
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
}

/* ══════════════════════════════════════════════════
   LAYOUT
   ══════════════════════════════════════════════════ */
@layer layout {
  .container {
    width: min(100% - 2rem, 1120px);
    margin-inline: auto;
  }
  @media (min-width: 600px) {
    .container { width: min(100% - 3rem, 1120px); }
  }

  .content {
    width: min(100% - 2rem, 720px);
    margin-inline: auto;
    padding-block: clamp(3rem, 8vw, 6rem);
  }
  @media (min-width: 600px) {
    .content { width: min(100% - 3rem, 720px); }
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
}

/* ══════════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════════ */
@layer components {

  /* ── Reading progress bar ── */
  .reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 30;
    height: 3px;
    width: 100%;
    background: var(--border-light);
    pointer-events: none;
  }
  .reading-progress::after {
    content: "";
    display: block;
    height: 100%;
    width: var(--reading-progress);
    background: var(--accent);
    transition: width .1s linear;
  }

  /* ── Skip link ── */
  .skip-link {
    position: absolute;
    left: 1rem;
    top: -4rem;
    z-index: 20;
    padding: .6rem 1.2rem;
    border-radius: var(--radius-sm);
    color: #fff;
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
    gap: 1.5rem;
    padding-block: .5rem;
  }
  @media (min-width: 600px) {
    .site-nav { min-height: 72px; padding-block: 0; }
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
    color: #fff;
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

  /* nav links */
  .nav-links {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: .4rem 1rem;
  }
  @media (min-width: 600px) {
    .nav-links { gap: 1.6rem; }
  }
  .nav-links a {
    color: var(--fg-muted);
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .05em;
    text-decoration: none;
    transition: color .2s ease;
  }
  .nav-links a:hover { color: var(--accent); }
  .nav-links .language-link {
    padding-left: 1rem;
    border-left: 1px solid var(--border);
    color: var(--fg);
  }
  @media (min-width: 600px) {
    .nav-links .language-link { padding-left: 1.6rem; }
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
  }
  @media (min-width: 600px) {
    .hero-inner { width: min(100% - 3rem, 880px); }
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
  }
  .hero-orbit::after {
    content: "";
    position: absolute;
    inset: 1.5rem;
    border: 1px solid oklch(62% 0.16 80 / .10);
    border-radius: 50%;
  }
  .hero-orbit-left  { top: 10%; left: -9rem; }
  .hero-orbit-right { right: -10rem; bottom: 2%; }
  @media (min-width: 760px) {
    .hero-orbit { width: 18rem; height: 18rem; }
    .hero-orbit::after { inset: 1.8rem; }
    .hero-orbit-left  { left: -10rem; }
    .hero-orbit-right { right: -11rem; }
  }

  /* ── Sections ── */
  .section {
    padding-block: clamp(3.5rem, 8vw, 7rem);
    border-top: 1px solid var(--border);
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
  }
  @media (min-width: 700px) {
    .section-heading {
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
  }
  @media (min-width: 540px) {
    .archive-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
  }
  @media (min-width: 900px) {
    .archive-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
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
    transition:
      border-color .25s ease,
      box-shadow .25s ease,
      transform .25s ease,
      background .25s ease;
  }
  @media (min-width: 600px) {
    .card { padding: 2rem; }
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
  .card:hover {
    border-color: var(--accent-soft);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  .card:hover::before { transform: scaleX(1); }
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
  }
  @media (min-width: 700px) {
    .archive-note {
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
  }
  .markdown h1 { font-size: 2rem; }
  .markdown h2 { font-size: 1.6rem; }
  .markdown h3 { font-size: 1.25rem; }
  .markdown p  { margin-bottom: 1.5rem; }
  .markdown a  { color: var(--accent); }
  .markdown a:hover { color: var(--accent-soft); }
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
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    aspect-ratio: auto;
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
  }
  .markdown pre code {
    padding: 0;
    background: none;
    font-size: .85em;
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
  }
  @media (min-width: 600px) {
    .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
  }
  .gallery figure { margin: 0; }
  .gallery img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-muted);
    aspect-ratio: 3/2;
    object-fit: cover;
  }
  .gallery figcaption {
    padding-top: .5rem;
    color: var(--fg-muted);
    font-size: .85rem;
  }

  /* ── Listing (category / search results) ── */
  .listing-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }
  @media (min-width: 700px) {
    .listing-header {
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
    transition: background .2s ease;
  }
  @media (min-width: 600px) {
    .listing-card {
      grid-template-columns: 140px 1fr auto;
      gap: 1.5rem;
      padding: 1.8rem 0;
    }
  }
  .listing-card:hover { background: oklch(50% 0 0 / .02); }
  .listing-card .post-meta {
    margin: .2rem 0 0;
    grid-row: 1;
  }
  .listing-card > div { grid-column: 1; }
  @media (min-width: 600px) {
    .listing-card .post-meta { grid-row: auto; }
    .listing-card > div { grid-column: auto; }
  }
  .listing-card h2 {
    margin-bottom: .4rem;
    font-family: var(--serif);
    font-size: 1.3rem;
    font-weight: 500;
    line-height: 1.3;
  }
  @media (min-width: 600px) {
    .listing-card h2 { font-size: 1.45rem; }
  }
  .listing-card h2 a { text-decoration: none; }
  .listing-card p {
    max-width: 570px;
    color: var(--fg-muted);
    text-wrap: pretty;
  }
  .listing-arrow {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    color: var(--accent);
    font-size: 1.2rem;
  }
  @media (min-width: 600px) {
    .listing-arrow {
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
  .search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px oklch(62% 0.16 80 / .16);
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
    color: #fff;
    background: var(--accent);
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .05em;
    text-decoration: none;
    transition: background .2s ease, transform .2s ease, box-shadow .2s ease;
  }
  .button:hover {
    color: #fff;
    background: var(--accent-soft);
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
  }
  @media (min-width: 600px) {
    .site-footer {
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
      display: none !important;
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
    }
    .markdown a { color: #000; text-decoration: underline; }
    .markdown a::after {
      content: " (" attr(href) ")";
      font-size: .8em;
      color: #555;
    }
    .markdown img { max-width: 100% !important; page-break-inside: avoid; }
    .markdown pre, .markdown blockquote {
      border: 1px solid #ccc;
      background: #f8f8f8;
    }
  }
}
`;
