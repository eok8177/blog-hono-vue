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

## Архітектура

Public HTML рендериться Hono JSX без Vue. `/admin/` — окрема Vue SPA; `/api/admin/*` має Cloudflare Access JWT middleware і D1 role check. Bindings та production IDs налаштовуються лише у `wrangler.jsonc`/Cloudflare, без secrets у Git. Докладніше: `docs/architecture.md`, `docs/deployment.md`.
