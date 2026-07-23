import type { FC } from 'hono/jsx';

export const Footer: FC<{
  lang: 'uk' | 'en';
  brand: string;
  footer: string;
}> = ({ lang, brand, footer }) => {
  return (
    <footer class="site-footer container">
      <div>
        <a class="footer-wordmark" href={lang === 'uk' ? '/' : '/en/'}>
          {brand}
        </a>
        <p>{footer}</p>
      </div>
      <div class="footer-meta">
        <span class="small-caps">
          {lang === 'uk' ? 'Південна Україна' : 'Southern Ukraine'}
        </span>
        <span class="footer-rule" aria-hidden="true" />
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
};
