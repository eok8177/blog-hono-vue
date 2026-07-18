# Архітектура

Worker є єдиним origin: Hono повертає SSR public HTML, `/api/admin/*` — JSON, `/admin/*` — fallback на Vue `index.html`. Конкретні system/API/admin routes реєструються до `/:slug`.

D1 schema є у `apps/worker/src/db/schema.ts`, а production migrations застосовуються послідовно з каталогу `migrations/`. Drizzle ініціалізується в service layer; FTS5 та індекси створюються raw SQL, оскільки це SQLite-specific.

Access middleware криптографічно перевіряє `Cf-Access-Jwt-Assertion` через Access JWK, issuer/audience/expiry, потім знаходить active D1 user. `DEV_AUTH_BYPASS` дозволений лише при `ENVIRONMENT=development`.

R2 public variants мають immutable content-hashed keys і `Cache-Control: public, max-age=31536000, immutable`; originals не мають public route. Admin/API використовують `no-store`, а public HTML має короткий edge-cache TTL. Архівування через admin-списки постів, сторінок і категорій замінено на admin-only повне видалення з relation cleanup та audit log; медіа додатково видаляється з R2.
