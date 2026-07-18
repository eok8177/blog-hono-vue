# Backup and restore

## D1

Create an explicit remote export (the script never receives a secret):

```sh
scripts/backup-d1.sh <production-database-name>
```

Store the resulting SQL export encrypted outside the primary Cloudflare failure domain. Configure a scheduled external copy only after the owner chooses a destination; do not put storage credentials in Git. D1 Time Travel retention depends on the current plan and is not a substitute for tested exports.

## R2

Keep a read-only object inventory outside R2. Compare its keys with `media.variant_480_key`, `variant_960_key`, and `variant_1600_key` before any cleanup. `scripts/r2-inventory.sh` is deliberately non-destructive and documents this operator step.

## Restore drill

1. Create an isolated **local test** D1 database and a fixture R2 bucket.
2. Apply migrations and import an export:
   ```sh
   scripts/restore-smoke.sh <local-test-database> backups/export.sql
   ```
3. Bind a test Worker to those resources; never point the drill at production.
4. Verify a public page, admin Access flow, FTS search and media response.
5. Record the date, export checksum and result.
