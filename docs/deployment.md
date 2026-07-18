# Deployment checklist

1. Create separate D1 databases and R2 buckets for staging/production.
2. Replace placeholder database IDs, bucket names and `SITE_URL` in environment config; run `pnpm exec wrangler types`.
3. Create Access application covering `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`; configure email/IdP policy and copy team domain/audience to non-secret vars.
4. Set `TURNSTILE_SECRET_KEY` only with `pnpm exec wrangler secret put`; never commit it. Set `DEV_AUTH_BYPASS` nowhere outside local `.dev.vars`.
5. Build, dry-run, migrate then deploy: `pnpm build`; `pnpm exec wrangler d1 migrations apply <db> --env production --remote`; `pnpm exec wrangler deploy --env production --dry-run`; `pnpm exec wrangler deploy --env production`.
6. Verify Access, a public SSR page, `robots.txt`, sitemap, media headers and admin `Cache-Control: no-store`.

## Cost and monitoring

Cloudflare changes quotas and billing, so confirm the current Workers, D1, R2, Access and Turnstile pages in the Cloudflare dashboard immediately before deployment. For this low-traffic archive, the intended fixed cost is the domain only.

| Product   | Expected small-site use                          | Operator guardrail                                                          |
| --------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| Workers   | SSR/API requests on page views and admin actions | Enable Workers observability; review request and CPU usage monthly.         |
| D1        | Indexed page queries, occasional CMS writes, FTS | Monitor rows read/written and storage; keep pagination and indexes enabled. |
| R2        | Immutable WebP variants and periodic exports     | Monitor storage/Class A/Class B operations; retain an external inventory.   |
| Access    | A small editor allowlist                         | Keep Access policy limited to `/admin*` and `/api/admin*`; use 2FA/OTP.     |
| Turnstile | Only if contact form is enabled                  | Verify server-side tokens; review widget quota/dashboard.                   |

Configure Cloudflare usage notifications/spending limits where the selected plan supports them. Never rely on an undocumented free-tier value or enable paid overages without the owner’s approval.
