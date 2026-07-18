export const publicCss = String.raw`
:root {
  --background: #fafaf8;
  --foreground: #1a1a1a;
  --muted: #f5f3f0;
  --muted-foreground: #6b6b6b;
  --accent: #b8860b;
  --accent-secondary: #d4a84b;
  --border: #e8e4df;
  --card: #ffffff;
  --shadow-sm: 0 1px 2px rgb(26 26 26 / .04);
  --shadow-md: 0 4px 12px rgb(26 26 26 / .06);
  --serif: "Playfair Display", Georgia, "Times New Roman", serif;
  --sans: "Source Sans 3", "Segoe UI", system-ui, sans-serif;
  --mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--foreground);
  background: var(--background);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.75;
  letter-spacing: .01em;
  font-synthesis: none;
}
body::before {
  content: "";
  position: fixed;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  opacity: .25;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23fafaf8'/%3E%3Cstop offset='1' stop-color='%23f3ead8'/%3E%3C/linearGradient%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='1600' height='900' fill='url(%23sky)'/%3E%3Ccircle cx='1260' cy='170' r='92' fill='%23d4a84b' opacity='.18'/%3E%3Cpath d='M0 575 L0 510 L28 470 L44 510 L63 438 L82 510 L104 465 L124 510 L150 425 L178 510 L204 452 L228 510 L258 438 L286 510 L316 414 L346 510 L374 456 L400 510 L430 430 L462 510 L492 462 L520 510 L550 418 L580 510 L610 445 L640 510 L672 425 L704 510 L735 458 L765 510 L795 405 L828 510 L858 438 L888 510 L918 455 L948 510 L980 426 L1012 510 L1044 450 L1076 510 L1110 414 L1140 510 L1170 442 L1202 510 L1234 432 L1265 510 L1298 450 L1330 510 L1362 420 L1394 510 L1424 455 L1454 510 L1484 432 L1516 510 L1548 462 L1580 510 L1600 478 V600 H0Z' fill='%234e6b50' opacity='0'/%3E%3Cpath d='M0 600 C260 545 470 575 700 535 C960 490 1200 555 1600 485 V650 H0Z' fill='%233f5945' opacity='0'/%3E%3Cpath d='M100 585 L100 525 L126 482 L145 525 L168 452 L190 525 L218 475 L241 525 L270 438 L300 525 L330 470 L357 525 L390 450 L420 525 L448 490 L468 525 V620 H100Z' fill='%232f6844' opacity='0'/%3E%3Cpath d='M610 570 L610 520 L635 480 L654 520 L680 445 L703 520 L732 470 L755 520 L785 430 L815 520 L842 468 L870 520 L900 448 L930 520 L956 485 L980 520 V620 H610Z' fill='%232f6844' opacity='0'/%3E%3Cpath d='M1160 585 L1160 525 L1188 480 L1207 525 L1233 452 L1256 525 L1284 475 L1308 525 L1338 438 L1368 525 L1398 470 L1425 525 L1455 450 L1485 525 L1512 490 L1535 525 V620 H1160Z' fill='%232f6844' opacity='0'/%3E%3Cpath d='M92 582 C92 548 119 523 155 518 C184 488 234 492 268 512 C310 492 367 505 394 535 C425 543 443 563 443 588 C443 608 421 622 392 624 H142 C112 623 92 607 92 582Z' fill='%232f6844' opacity='.68'/%3E%3Cpath d='M602 570 C602 538 628 516 662 512 C690 480 740 486 774 506 C816 484 870 496 898 526 C930 534 950 554 950 578 C950 602 928 616 900 618 H652 C622 617 602 601 602 570Z' fill='%232f6844' opacity='.64'/%3E%3Cpath d='M1152 582 C1152 548 1179 523 1215 518 C1244 488 1294 492 1328 512 C1370 492 1427 505 1454 535 C1485 543 1503 563 1503 588 C1503 608 1481 622 1452 624 H1202 C1172 623 1152 607 1152 582Z' fill='%232f6844' opacity='0'/%3E%3Cpath d='M0 560 C240 430 410 520 620 450 C850 375 1000 510 1210 430 C1390 365 1510 410 1600 350 V900 H0Z' fill='%23d8b875' opacity='.18'/%3E%3Cpath d='M0 660 C230 535 400 625 650 550 C900 475 1080 610 1290 520 C1440 455 1530 490 1600 465 V900 H0Z' fill='%23b8860b' opacity='.13'/%3E%3Cpath d='M0 770 C260 670 480 735 720 670 C980 600 1200 720 1600 590' fill='none' stroke='%23b8860b' stroke-width='2' opacity='.2'/%3E%3Cpath d='M0 805 C310 720 510 790 820 720 C1100 655 1350 770 1600 660' fill='none' stroke='%23b8860b' stroke-width='1' opacity='.14'/%3E%3Crect width='1600' height='900' filter='url(%23grain)' opacity='.08'/%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
a { color: var(--foreground); text-decoration-thickness: 1px; text-underline-offset: 4px; }
a:hover { color: var(--accent); }
a:focus-visible, button:focus-visible, input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
button, input { font: inherit; }
button { cursor: pointer; }
h1, h2, h3 { font-family: var(--serif); font-weight: 500; }

.shell { width: min(100% - 3rem, 1120px); margin-inline: auto; }
.small-caps, .section-label, .post-meta, .eyebrow, .pagination-label {
  font-family: var(--mono);
  font-size: .72rem;
  font-weight: 500;
  letter-spacing: .15em;
  text-transform: uppercase;
}
.skip-link { position: absolute; left: 1rem; top: -4rem; z-index: 20; padding: .6rem 1rem; color: #fff; background: var(--foreground); }
.skip-link:focus { top: 1rem; }
.site-header { position: relative; border-bottom: 1px solid var(--border); background: rgb(250 250 248 / .88); backdrop-filter: blur(10px); }
.site-nav { display: flex; align-items: center; justify-content: space-between; min-height: 90px; gap: 2rem; }
.wordmark, .footer-wordmark { color: var(--foreground); text-decoration: none; }
.wordmark { display: inline-flex; align-items: center; gap: .75rem; line-height: 1.15; }
.wordmark-mark { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--accent); color: var(--accent); font-family: var(--serif); font-size: 1.35rem; font-style: italic; }
.wordmark strong { display: block; font-family: var(--serif); font-size: 1.15rem; font-weight: 600; }
.wordmark small { display: block; margin-top: .25rem; color: var(--muted-foreground); font-family: var(--mono); font-size: .58rem; letter-spacing: .13em; text-transform: uppercase; }
.nav-links { display: flex; align-items: center; gap: 1.8rem; }
.nav-links a { color: var(--muted-foreground); font-size: .83rem; font-weight: 600; letter-spacing: .06em; text-decoration: none; }
.nav-links a:hover { color: var(--accent); }
.nav-links .language-link { padding-left: 1.8rem; border-left: 1px solid var(--border); color: var(--foreground); }
main { min-height: 70vh; }
.hero { position: relative; padding: clamp(5rem, 12vw, 9rem) 0 clamp(5rem, 10vw, 8rem); overflow: hidden; }
.hero-inner { width: min(100% - 3rem, 880px); margin-inline: auto; text-align: center; }
.eyebrow { margin: 0 0 1.5rem; color: var(--accent); }
.hero h1 { max-width: 850px; margin: 0 auto 1.7rem; font-family: var(--serif); font-size: clamp(2.7rem, 7vw, 5.5rem); font-weight: 400; letter-spacing: -.035em; line-height: 1.08; }
.hero h1 em { color: var(--accent); font-style: italic; }
.hero-intro { max-width: 610px; margin: 0 auto; color: var(--muted-foreground); font-size: clamp(1.05rem, 2vw, 1.25rem); line-height: 1.8; }
.hero-rule { display: flex; align-items: center; gap: 1rem; max-width: 540px; margin: 3rem auto 0; color: var(--accent); font-family: var(--serif); font-style: italic; }
.hero-rule::before, .hero-rule::after { content: ""; height: 1px; flex: 1; background: var(--border); }
.hero-orbit { position: absolute; width: 18rem; height: 18rem; border: 1px solid rgb(184 134 11 / .15); border-radius: 50%; pointer-events: none; }
.hero-orbit::after { content: ""; position: absolute; inset: 1.8rem; border: 1px solid rgb(184 134 11 / .12); border-radius: 50%; }
.hero-orbit-left { top: 12%; left: -10rem; }
.hero-orbit-right { right: -11rem; bottom: 4%; }
.section { padding: clamp(4.5rem, 9vw, 8rem) 0; border-top: 1px solid var(--border); }
.section-label { display: flex; align-items: center; gap: 1rem; margin-bottom: 2.6rem; color: var(--accent); }
.section-label > span:first-child, .section-label > span:last-child { height: 1px; flex: 1; background: var(--border); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 2.5rem; }
.section-heading h2 { max-width: 620px; margin: 0; font-family: var(--serif); font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; letter-spacing: -.025em; line-height: 1.2; }
.section-heading p { max-width: 360px; margin: 0; color: var(--muted-foreground); }
.text-link { color: var(--foreground); font-size: .82rem; font-weight: 600; letter-spacing: .08em; text-decoration: none; white-space: nowrap; }
.text-link::after { content: "  →"; color: var(--accent); }
.archive-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.card { position: relative; display: flex; flex-direction: column; min-height: 100%; padding: 2rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card); box-shadow: var(--shadow-sm); transition: border-color .2s ease-out, box-shadow .2s ease-out, background .2s ease-out; }
.card::before { content: ""; position: absolute; top: -1px; left: 2rem; right: 2rem; height: 2px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform .2s ease-out; }
.card:hover { border-color: var(--accent-secondary); background: #fffefa; box-shadow: var(--shadow-md); }
.card:hover::before { transform: scaleX(1); }
.card .post-meta { margin-bottom: 1.2rem; color: var(--accent); }
.card h2, .card h3 { margin: 0 0 .8rem; font-family: var(--serif); font-weight: 600; line-height: 1.3; }
.card h2 { font-size: 1.35rem; }
.card h3 { font-size: 1.2rem; }
.card h2 a, .card h3 a { text-decoration: none; }
.card p { margin: 0; color: var(--muted-foreground); line-height: 1.7; }
.card .read-more { margin-top: auto; padding-top: 1.5rem; color: var(--foreground); font-size: .78rem; font-weight: 600; letter-spacing: .08em; text-decoration: none; }
.card .read-more::after { content: "  ↗"; color: var(--accent); }
.archive-note { display: grid; grid-template-columns: 1.25fr .75fr; gap: 5rem; align-items: center; }
.archive-note h2 { margin: 0; font-family: var(--serif); font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 400; line-height: 1.15; }
.archive-note p { margin: 0; color: var(--muted-foreground); }
.note-mark { border-top: 1px solid var(--accent); padding-top: 1.5rem; color: var(--muted-foreground); font-family: var(--mono); font-size: .72rem; letter-spacing: .12em; line-height: 1.8; text-transform: uppercase; }
.page-shell { width: min(100% - 3rem, 920px); margin-inline: auto; padding: clamp(4rem, 9vw, 7rem) 0; }
.page-shell.narrow { max-width: 760px; }
.breadcrumb { margin-bottom: 2.5rem; color: var(--muted-foreground); font-family: var(--mono); font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; }
.breadcrumb a { color: var(--muted-foreground); text-decoration: none; }
.page-title { max-width: 840px; margin: 0 0 1.3rem; font-family: var(--serif); font-size: clamp(2.5rem, 6vw, 4.8rem); font-weight: 400; letter-spacing: -.035em; line-height: 1.1; }
.lede { max-width: 700px; margin: 0; color: var(--muted-foreground); font-size: 1.2rem; line-height: 1.8; }
.post-header { padding-bottom: 3.5rem; border-bottom: 1px solid var(--border); }
.post-meta { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; margin: 0 0 1.5rem; color: var(--accent); }
.post-body { max-width: 740px; margin: 3.5rem auto 0; }
.markdown { color: #30302e; font-size: 1.08rem; line-height: 1.85; }
.markdown h1, .markdown h2, .markdown h3 { margin: 3rem 0 1rem; color: var(--foreground); font-family: var(--serif); font-weight: 500; line-height: 1.25; }
.markdown h1 { font-size: 2.3rem; }
.markdown h2 { font-size: 1.8rem; }
.markdown h3 { font-size: 1.4rem; }
.markdown p { margin: 0 0 1.5rem; }
.markdown a { color: var(--accent); }
.markdown blockquote { margin: 2rem 0; padding: 1rem 1.5rem; border-left: 2px solid var(--accent); color: var(--muted-foreground); font-family: var(--serif); font-size: 1.35rem; font-style: italic; }
.markdown img { max-width: 100%; height: auto; border: 1px solid var(--border); }
.markdown code { padding: .15rem .35rem; background: var(--muted); font-family: var(--mono); font-size: .8em; }
.gallery { margin-top: 5rem; padding-top: 2rem; border-top: 1px solid var(--border); }
.gallery h2 { margin: 0 0 1.5rem; font-family: var(--serif); font-size: 2rem; font-weight: 400; }
.gallery-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
.gallery figure { margin: 0; }
.gallery img { display: block; width: 100%; height: auto; border: 1px solid var(--border); background: var(--muted); }
.gallery figcaption { padding-top: .6rem; color: var(--muted-foreground); font-size: .85rem; }
.listing-header { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--border); }
.listing-header h1 { margin: 0; font-family: var(--serif); font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 400; letter-spacing: -.035em; line-height: 1.1; }
.listing-header p { max-width: 390px; margin: 0; color: var(--muted-foreground); }
.post-list { display: grid; gap: 1px; margin-top: 2.5rem; border-top: 1px solid var(--border); }
.listing-card { display: grid; grid-template-columns: 150px 1fr auto; gap: 2rem; align-items: start; padding: 2rem 0; border-bottom: 1px solid var(--border); }
.listing-card .post-meta { margin: .3rem 0 0; }
.listing-card h2 { margin: 0 0 .5rem; font-family: var(--serif); font-size: 1.55rem; font-weight: 500; line-height: 1.3; }
.listing-card h2 a { text-decoration: none; }
.listing-card p { max-width: 570px; margin: 0; color: var(--muted-foreground); }
.listing-arrow { align-self: center; color: var(--accent); font-size: 1.4rem; }
.pagination { display: flex; justify-content: space-between; gap: 1rem; margin-top: 3rem; }
.pagination a { color: var(--foreground); font-size: .8rem; font-weight: 600; letter-spacing: .08em; text-decoration: none; }
.pagination a:hover { color: var(--accent); }
.empty-state { padding: 3rem 0; color: var(--muted-foreground); }
.search-form { display: flex; gap: .75rem; margin: 2.5rem 0 3.5rem; }
.search-form label { flex: 1; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.search-input { width: 100%; height: 48px; padding: .6rem 1rem; border: 1px solid var(--border); border-radius: 6px; color: var(--foreground); background: transparent; transition: border-color .15s ease-out, box-shadow .15s ease-out; }
.search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgb(184 134 11 / .14); outline: none; }
.button { min-height: 44px; padding: .65rem 1.3rem; border: 1px solid var(--accent); border-radius: 6px; color: #fff; background: var(--accent); font-size: .82rem; font-weight: 600; letter-spacing: .06em; text-decoration: none; transition: background .2s ease-out, transform .2s ease-out, box-shadow .2s ease-out; }
.button:hover { color: #fff; background: var(--accent-secondary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.search-results { display: grid; gap: 1rem; }
.site-footer { display: flex; justify-content: space-between; gap: 2rem; padding-top: 2.5rem; padding-bottom: 2.5rem; border-top: 1px solid var(--border); color: var(--muted-foreground); }
.footer-wordmark { font-family: var(--serif); font-size: 1.2rem; }
.site-footer p { margin: .25rem 0 0; font-size: .85rem; }
.footer-meta { display: flex; align-items: center; gap: 1rem; align-self: end; font-size: .75rem; }
.footer-rule { width: 48px; height: 1px; background: var(--border); }
@media (max-width: 760px) {
  .shell, .hero-inner, .page-shell { width: min(100% - 2rem, 1120px); }
  .site-nav { min-height: 76px; align-items: start; padding: 1rem 0; }
  .nav-links { flex-wrap: wrap; justify-content: end; gap: .35rem 1rem; }
  .nav-links a { font-size: .72rem; }
  .nav-links .language-link { padding-left: 1rem; }
  .wordmark small { display: none; }
  .archive-grid { grid-template-columns: 1fr; }
  .section-heading, .listing-header, .site-footer { display: block; }
  .section-heading p, .listing-header p { margin-top: 1rem; }
  .archive-note { grid-template-columns: 1fr; gap: 2rem; }
  .listing-card { grid-template-columns: 1fr auto; gap: .5rem 1rem; }
  .listing-card .post-meta { grid-row: 1; }
  .listing-card > div { grid-column: 1; }
  .listing-arrow { grid-column: 2; grid-row: 1 / span 2; }
  .gallery-grid { grid-template-columns: 1fr; }
  .footer-meta { margin-top: 1.5rem; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
`;
