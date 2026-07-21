# Архів фауни півдня України

Монорепозиторій для SSR-архіву: Hono на Cloudflare Workers, D1/Drizzle, R2 і Vue 3 admin SPA.

## Версії

Node 26+, pnpm 10.15.1, Hono 4.12, Vue 3.5, Wrangler 4.112, Drizzle 0.45, Vite 8, TypeScript 5.9.

## Локальний старт

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
wrangler d1 execute fauna-archive-dev --local --file scripts/seed.sql
pnpm dev
```

Зібрати admin перед `wrangler dev`, якщо Worker static assets не зібрані: `pnpm --filter @fauna/admin build`.

## Перевірки

`pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm verify`.

## Деплой на прод
```sh
pnpm exec wrangler d1 migrations apply fauna-archive-production-db --env production --remote
pnpm wrangler deploy --env production
```

## Архітектура

Public HTML рендериться Hono JSX без Vue. `/admin/` — окрема Vue SPA; `/api/admin/*` має Cloudflare Access JWT middleware і D1 role check. Bindings та production IDs налаштовуються лише у `wrangler.jsonc`/Cloudflare, без secrets у Git. Докладніше: `docs/architecture.md`, `docs/deployment.md`.

## Safety and verification

- `worker-configuration.d.ts` генерується командою `pnpm exec wrangler types`; CI перевіряє його через `pnpm types:check`.
- Production deployment запускається лише через `pnpm deploy:production`, який вимагає HTTPS `SITE_URL`, Access domain/audience та відсутність `DEV_AUTH_BYPASS`.
- Адмін HTML додатково перевіряє Access JWT/роль у Worker; API має `no-store`, public HTML має edge-cache TTL до 5 хвилин.
- Upload приймає лише WebP variants із перевіркою magic bytes, розміру, dimensions, aspect ratio та pixel limit. Невідомий media variant повертає 404.
- Архівування в admin-списках постів, сторінок і категорій замінено на незворотне повне видалення з перевіркою зв'язків та audit log. Для медіа повне видалення також прибирає всі R2 objects; операцію виконує лише admin.
- E2E тести ізольовані в `e2e/` через `playwright.config.ts`; перед локальним запуском один раз виконайте `pnpm exec playwright install chromium`.
- Повний локальний набір: `pnpm verify`, `pnpm db:migrate:local`, `pnpm db:seed:local`, `pnpm test:e2e`.
