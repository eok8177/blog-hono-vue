# Acceptance matrix

Оновлено: 2026-07-18. Це traceability-матриця для розділу 36 `docs/tz-blog.md`; статуси не означають production sign-off.

| Область    | Критерій / evidence                                                   | Статус                                                                                           |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public     | SSR routing, `/en -> /en/`, published-only visibility                 | Частково; smoke tests у `apps/worker/test/routes.integration.test.ts`                            |
| Public     | Published sitemap includes UK/EN home and published entities          | Частково; implementation in `apps/worker/src/index.tsx`, pagination still pending                |
| Admin      | Vue SPA base, nested refresh fallback, no-store                       | Реалізовано локально; covered by route config and `adminSpa`                                     |
| Admin      | CRUD with status saved in the edit form                               | Частково; posts/pages/categories saves require revision and audit status changes atomically      |
| Admin      | Stale post update is a no-op                                          | Реалізовано; `apps/worker/test/posts.concurrency.test.ts`                                        |
| Admin      | Field-level errors, full list filtering/sorting, unsaved router guard | Відкладено                                                                                       |
| Data       | Full Drizzle schema and D1 factory                                    | Реалізовано локально; `apps/worker/src/db/schema.ts`, `db/client.ts`                             |
| Data       | Drizzle repository boundary                                           | Частково; typed users list in `repositories/users.ts`, remaining CRUD migration pending          |
| Data       | Fresh migrations and seed                                             | Перевірено локально: `pnpm db:migrate:local`, `pnpm db:seed:local`                               |
| Data       | FTS sync after all state transitions                                  | Частково; existing triggers cover post/page, category/archive regression pending                 |
| Security   | Access JWT, roles, parameterized SQL, security headers                | Реалізовано локально; external Access setup required                                             |
| Security   | Structured request ID logs and no raw error messages                  | Реалізовано                                                                                      |
| Media      | Browser fixture variants, recoverable R2 saga, progress/retry         | Відкладено                                                                                       |
| SEO/A11y   | canonical/hreflang/JSON-LD/axe/Lighthouse                             | Частково; automated axe/Lighthouse evidence pending                                              |
| Operations | Separate staging D1/R2 bindings                                       | Реалізовано в `wrangler.jsonc`; resource creation/IDs require Cloudflare setup                   |
| Operations | Backup/restore and R2 consistency report                              | Відкладено; scripts remain smoke/manual                                                          |
| Quality    | lint, format, typecheck, tests, build                                 | Реалізовано локально; all checks green, Worker runtime emits compatibility-date fallback warning |
| Cost       | No VPS, monitoring and current limits docs                            | Частково; monitoring guidance exists, current official limit verification pending                |

## Current gate

P0 data-safety regressions are covered for stale post updates and status changes are revision-checked. The repository is **not production-ready** until the remaining `Частково`/`Відкладено` rows receive code, tests, or an explicit external/manual evidence record.
