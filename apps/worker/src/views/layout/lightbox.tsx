import type { FC } from 'hono/jsx';

export const Lightbox: FC<{ lang: 'uk' | 'en' }> = ({ lang }) => {
  return (
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
      <button
        class="lightbox-btn lightbox-close"
        type="button"
        data-lightbox-close
        aria-label={lang === 'uk' ? 'Закрити' : 'Close'}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <button
        class="lightbox-btn lightbox-prev"
        type="button"
        id="lightbox-prev"
        aria-label={lang === 'uk' ? 'Попереднє' : 'Previous'}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        class="lightbox-btn lightbox-next"
        type="button"
        id="lightbox-next"
        aria-label={lang === 'uk' ? 'Наступне' : 'Next'}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div class="lightbox-counter" id="lightbox-counter" />
      <div class="lightbox-caption" id="lightbox-caption" />
    </div>
  );
};
