# Deployment checklist

1. Create separate D1 databases and R2 buckets for staging/production.
2. Replace placeholder database IDs, bucket names and `SITE_URL` in environment config; run `pnpm exec wrangler types`.
3. Create Access application covering `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`; configure email/IdP policy and copy team domain/audience to non-secret vars.
4. Set `TURNSTILE_SECRET_KEY` only with `wrangler secret put`; never commit it. Set `DEV_AUTH_BYPASS` nowhere outside local `.dev.vars`.
5. Build, dry-run, migrate then deploy: `pnpm build`; `wrangler d1 migrations apply <db> --env production --remote`; `wrangler deploy --env production --dry-run`; `wrangler deploy --env production`.
6. Verify Access, a public SSR page, `robots.txt`, sitemap, media headers and admin `Cache-Control: no-store`.

Review current Cloudflare Workers/D1/R2/Access/Turnstile pricing and set dashboard usage/spending alerts before production; limits and prices change.
