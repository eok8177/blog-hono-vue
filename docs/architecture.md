# Архітектура

Worker є єдиним origin: Hono повертає SSR public HTML, `/api/admin/*` — JSON, `/admin/*` — fallback на Vue `index.html`. Конкретні system/API/admin routes реєструються до `/:slug`.

D1 schema є у `apps/worker/src/db/schema.ts`, а production migrations застосовуються послідовно з каталогу `migrations/`. `database()` у `apps/worker/src/db/client.ts` є repository boundary для Drizzle D1; FTS5, тригери та складні SQLite-specific запити залишаються в raw SQL migrations/services.

Access middleware криптографічно перевіряє `Cf-Access-Jwt-Assertion` через Access JWK, issuer/audience/expiry, потім знаходить active D1 user. `DEV_AUTH_BYPASS` дозволений лише при `ENVIRONMENT=development`.

R2 public variants мають immutable content-hashed keys і `Cache-Control: public, max-age=31536000, immutable`; originals не мають public route. Admin/API використовують `no-store`, а public HTML має короткий edge-cache TTL. Статус (`draft`, `published`, `archived`) зберігається разом з формою через version-checked mutation та audit event. Hard delete лишається admin-only і має relation cleanup; для медіа R2 cleanup виконується окремим lifecycle flow.
