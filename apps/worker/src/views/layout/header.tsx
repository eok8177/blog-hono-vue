import type { FC } from 'hono/jsx';

export const Header: FC<{
  lang: 'uk' | 'en';
  brand: string;
  search: string;
  languageLabel: string;
  languageHref?: string | undefined;
  menuItems?: Array<{ label: string; href: string }> | undefined;
}> = ({ lang, brand, search, languageLabel, languageHref, menuItems = [] }) => {
  return (
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
            <strong>{brand}</strong>
            <small>{lang === 'uk' ? 'південь України' : 'southern Ukraine'}</small>
          </span>
        </a>
        <div class="nav-group">
          <div class="nav-menu" id="nav-menu">
            <div class="nav-menu-panel">
              {menuItems.map((item) => (
                <a class="nav-menu-link" href={item.href}>{item.label}</a>
              ))}
              <a class="nav-menu-link" href={lang === 'uk' ? '/search' : '/en/search'}>{search}</a>
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
              {languageLabel}
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
  );
};
