## 🔴 Не виконані пункти (відсутні або майже відсутні)

### Публічний сайт

| #    | Пункт ТЗ                                                                                            | Статус |
| ---- | --------------------------------------------------------------------------------------------------- | ------ |
| 12.1 | Hero image на головній — не реалізовано (є лише декоративні orbit-спани)                            | ❌     |
| 12.1 | Блок про автора/дослідника на головній                                                              | ❌     |
| 12.3 | Cover image (обкладинка) поста — cover_media_id є в схемі, але не використовується в SSR-рендерингу | ❌     |
| 12.3 | Related posts (пов'язані публікації)                                                                | ❌     |
| 12.4 | Контактна форма — таблиця contact_messages відсутня в міграції та схемі                             | ❌     |
| 20.2 | Turnstile server-side verification для контактної форми — немає форми, немає перевірки              | ❌     |

### Admin API

| #    | Пункт ТЗ                                                                                            | Статус |
| ---- | --------------------------------------------------------------------------------------------------- | ------ |
| 13.2 | POST .../posts/:id/publish — окремий ендпоінт публікації відсутній (публікація через загальний PUT) | ❌     |
| 13.2 | POST .../posts/:id/archive — окремий ендпоінт архівації відсутній                                   | ❌     |
| 13.2 | POST .../pages/:id/publish та .../archive — відсутні                                                | ❌     |
| 13.3 | Idempotency для mutating endpoints — не реалізовано                                                 | ❌     |

### Vue Admin UX

| #    | Пункт ТЗ                                                                                                      | Статус |
| ---- | ------------------------------------------------------------------------------------------------------------- | ------ |
| 14.1 | Toast notifications — відсутні                                                                                | ❌     |
| 14.1 | Skeleton/progress states для довгих операцій — є лише «Завантаження…»                                         | ❌     |
| 14.1 | Retry після тимчасової помилки — не реалізовано                                                               | ❌     |
| 14.2 | Сортування (server-side sorting) у списках — не реалізовано                                                   | ❌     |
| 14.2 | Фільтри за статусом/мовою/датою — лише search, без фільтрів                                                   | ❌     |
| 14.2 | Збереження filter state в URL query                                                                           | ❌     |
| 14.2 | Індикатор активних фільтрів                                                                                   | ❌     |
| 14.2 | Bulk actions — не реалізовано (але ТЗ каже «лише там, де реалізовані»)                                        | ❌     |
| 14.3 | Окремі вкладки/секції «Українська», «English», «SEO», «Медіа», «Публікація» — форма пласка, без вкладок       | ❌     |
| 14.3 | Slug generator з ручним редагуванням — відсутній                                                              | ❌     |
| 14.3 | Markdown editor із toolbar і preview — Milkdown є, але базовий                                                | ⚠️     |
| 14.3 | Лічильник довжини SEO title/description                                                                       | ❌     |
| 14.3 | Navigation guard (Vue Router) перед закриттям з незбереженими змінами — тільки beforeunload, без router guard | ⚠️     |
| 14.3 | Блокування повторного submit — кнопка disabled під час saving, але немає idempotency key                      | ⚠️     |
| 14.5 | Останні audit events на dashboard                                                                             | ❌     |
| 14.5 | Попередження про матеріали без SEO description, alt, перекладу                                                | ❌     |
| 14.5 | Приблизний обсяг R2 — bytes запитується, але не відображається                                                | ❌     |
| 14.6 | Час останньої адміністративної активності — last_seen_at оновлюється, але не показується в UI                 | ❌     |

### Доступність (admin + public)

| #    | Пункт ТЗ                                                           | Статус |
| ---- | ------------------------------------------------------------------ | ------ |
| 14.9 | Admin accessibility (WCAG 2.2 AA) — не перевірено, немає axe tests | ❌     |
| 14.9 | Focus trap для modal                                               | ❌     |
| 14.9 | aria-live для async-повідомлень                                    | ❌     |
| 24   | Public skip link — є в layout, але не перевірено функціонально     | ⚠️     |
| 24   | Public axe tests і keyboard smoke test — не виконано               | ❌     |

### Медіа

| #    | Пункт ТЗ                                                            | Статус |
| ---- | ------------------------------------------------------------------- | ------ |
| 19.1 | Browser-side WebP conversion — не реалізовано (клієнт не конвертує) | ❌     |
| 19.1 | Upload progress UI, cancel/retry — відсутні                         | ❌     |
| 19.1 | Original upload (зберігання оригіналу) — не реалізовано             | ❌     |
| 19.3 | Медіатека: upload queue, preview variants, retry/cleanup failed     | ❌     |
| 19.3 | Попередження перед archive media, яке використовується              | ❌     |
| 19.4 | Soft archive для media — тільки hard delete                         | ❌     |

### FTS / Пошук

| #   | Пункт ТЗ                                                                                   | Статус |
| --- | ------------------------------------------------------------------------------------------ | ------ |
| 17  | FTS для категорій — triggers є тільки для posts і pages, категорії не індексуються         | ❌     |
| 17  | FTS синхронізація через archive/language unpublish — частково (triggers є, але без тестів) | ⚠️     |

### Безпека

| #    | Пункт ТЗ                                                                         | Статус |
| ---- | -------------------------------------------------------------------------------- | ------ |
| 25.2 | Rate limiting для contact/search/upload — не реалізовано                         | ❌     |
| 25.2 | Обмеження request body size — частково (лише Content-Length перевірка для media) | ⚠️     |

### Кешування

| #   | Пункт ТЗ                                                                          | Статус |
| --- | --------------------------------------------------------------------------------- | ------ |
| 22  | Cache invalidation після publish/edit/archive — не реалізовано; fallback TTL 5 хв | ⚠️     |

### Тестування

| #    | Пункт ТЗ                                                                                                                     | Статус |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| 28.1 | Unit tests — майже відсутні. smoke.test.ts тривіальний. Немає тестів slug, locale, permissions, FTS, pagination, DTO mapping | ❌     |
| 28.2 | Worker integration tests — є routes.integration.test.ts і posts.concurrency.test.ts, але обсяг мінімальний                   | ⚠️     |
| 28.3 | Vue component tests — відсутні повністю                                                                                      | ❌     |
| 28.4 | E2E tests — лише 2 тести (robots.txt + 404). 10-flow сценарій з ТЗ не реалізовано                                            | ❌     |
| 28.5 | Accessibility і performance tests (axe, Lighthouse) — не виконано                                                            | ❌     |

### CI/CD

| #   | Пункт ТЗ                                                                                                   | Статус |
| --- | ---------------------------------------------------------------------------------------------------------- | ------ |
| 29  | Migration validation на порожній D1 в CI — db:migrate:local виконується після verify, але не перед тестами | ⚠️     |
| 29  | Deployment rollback procedure — не задокументовано                                                         | ❌     |
| 29  | Smoke test після deployment — не автоматизовано                                                            | ❌     |

### Резервне копіювання

| #    | Пункт ТЗ                                                                         | Статус |
| ---- | -------------------------------------------------------------------------------- | ------ |
| 30   | Backup scripts — backup-d1.sh та r2-inventory.sh є, але restore test не виконано | ⚠️     |
| 30.3 | Restore test — не виконано, не задокументовано                                   | ❌     |

### Документація

| #    | Пункт ТЗ                                                   | Статус |
| ---- | ---------------------------------------------------------- | ------ |
| 31.4 | docs/content-guide.md — інструкція для дослідника відсутня | ❌     |
| 37   | Фінальний звіт AI-агента — відсутній                       | ❌     |

---

## 🟡 Розходження з планом

| #             | Пункт ТЗ                                                                                 | Що в коді                                                                                                                                  | Розходження                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 7             | drizzle-kit push заборонено для production                                               | drizzle.config.ts є, але лише одна migration 0001_init.sql — не використовується Drizzle Kit генерація                                     | Міграції пишуться вручну, Drizzle schema є паралельно, але Drizzle Kit не використовується для генерації. Це прийнятне відхилення. |
| 8             | Preview, staging, production окремі ресурси                                              | У wrangler.jsonc є dev і production envs. Staging не налаштовано окремо                                                                    | Немає staging environment                                                                                                          |
| 10.1          | Адмінка українською — «Адміністративна панель у MVP — лише українською»                  | Деякі мітки англійською («English title», «Slug», «SEO title English»)                                                                     | Форма мішає українські та англійські назви полів — не уніфіковано                                                                  |
| 10.2          | Системні UI-тексти в централізованих словниках                                           | /layout/i18n.ts має лише 3 ключі (brand, search, language, footer). Решта UI-текстів вбудовано в JSX                                       | Більшість текстів не в словнику, а hardcoded у компонентах                                                                         |
| 14.1          | Responsive layout для desktop і tablet                                                   | Не перевірено в коді — CSS мінімальний                                                                                                     | Статус невідомий, імовірно базовий                                                                                                 |
| 14.4          | Language status у списку матеріалів                                                      | is_en_published повертається, але в UI списку не показується                                                                               | Колонка є в даних, але не візуалізується в таблиці                                                                                 |
| 15            | Tailwind CSS v4                                                                          | @tailwindcss/vite? У vite.config.ts не видно імпорту Tailwind. CSS-файли style.css, public.css.ts, serif-overrides.css без явного Tailwind | Не зрозуміло, чи Tailwind реально використовується. CSS виглядає як кастомний                                                      |
| 17            | FTS синхронізація через SQL triggers                                                     | Triggers реалізовано для posts і pages, але не для categories                                                                              | Категорії не потрапляють у FTS індекс                                                                                              |
| 22.1          | Довгий Cache-Control: immutable для hashed assets                                        | Media variants мають правильний cache. Але admin JS/CSS assets не мають hash в імені (Vite повинен додавати, але не перевірено)            | ⚠️                                                                                                                                 |
| 23            | Lighthouse targets                                                                       | Не виміряно, не задокументовано                                                                                                            | ❌                                                                                                                                 |
| 25.1          | CSP nonce-based inline scripts                                                           | Nonce є, але inlineScript() вставляється без 'strict-dynamic' у CSP                                                                        | Може не працювати в суворих браузерах                                                                                              |
| 32            | Seed data                                                                                | Лише 1 категорія, 1 пост, 2 сторінки, 1 redirect                                                                                           | ТЗ вимагає 2–3 категорії, 3–5 постів, 2–3 сторінки. Недостатньо.                                                                   |
| 32            | Media metadata з neutral placeholders                                                    | Медіафайлів у seed немає взагалі                                                                                                           | ❌                                                                                                                                 |
| 34 (Phase 8)  | Search/contact/cache фаза                                                                | Пошук є, але contact + Turnstile відсутні, cache invalidation відсутня                                                                     | Фаза 8 не завершена                                                                                                                |
| 34 (Phase 9)  | Hardening — security headers/CSP, error handling, performance, accessibility, full tests | CSP є, але безпека, продуктивність і accessibility не перевірені повністю                                                                  | Фаза 9 не завершена                                                                                                                |
| 34 (Phase 11) | Final verification — clean install, migration, seed, verify, E2E, production build       | Не виконано                                                                                                                                | Фаза 11 не завершена                                                                                                               |

---

## 🟢 Що реалізовано повністю

- ✅ Монорепо (pnpm workspaces): worker, admin, shared
- ✅ Hono + Cloudflare Workers + Vite plugin
- ✅ Vue 3 SPA + Vue Router (/admin/)
- ✅ Drizzle ORM + D1 driver + ручні SQL-міграції
- ✅ Повна D1-схема з foreign keys, constraints, indexes
- ✅ FTS5 з SQL-тригерами для posts/pages
- ✅ Усі основні CRUD-операції (posts, pages, categories, users, settings, redirects)
- ✅ Concurrent editing protection (revision + mutation_id + 409 Conflict)
- ✅ Access JWT verification (криптографічна перевірка підпису)
- ✅ DEV_AUTH_BYPASS для локальної розробки
- ✅ Ролі admin/editor з перевіркою на сервері
- ✅ SSR усіх публічних сторінок
- ✅ /en → /en/, /admin → /admin/ редиректи
- ✅ Публікація лише опублікованого контенту
- ✅ Slug change → 301 redirect
- ✅ Markdown + sanitization
- ✅ Sitemap (без пагінації)
- ✅ robots.txt
- ✅ Canonical, hreflang, JSON-LD Article
- ✅ Security headers (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy)
- ✅ R2 media upload із валідацією (magic bytes, dimensions, SHA-256)
- ✅ Content-hashed immutable media keys
- ✅ Media serving через Worker
- ✅ Server-side pagination
- ✅ FTS5 пошук
- ✅ CI/CD (lint, typecheck, test, build, E2E)
- ✅ Category hierarchy cycle detection
- ✅ Audit log
- ✅ Dashboard statistics

---

## 📊 Підсумкова статистика

- Повністю реалізовано: ~50 пунктів
- Частково реалізовано (розходження): ~15 пунктів
- Не реалізовано: ~35 пунктів
- MVP ready: ❌ Ні — занадто багато критичних прогалин у тестуванні, медіа, доступності та фінальній верифікації

Ключові блокери: майже відсутні тести, не реалізовано повний медіа-upload workflow, немає контактної форми, немає restore test, не виконано Lighthouse/axe перевірки.
