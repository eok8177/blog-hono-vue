# Backup and restore

Export D1 with `wrangler d1 export <database> --remote --output backup.sql`; store an encrypted copy outside the primary Cloudflare failure domain. Inventory R2 with `wrangler r2 object get/list` or an S3-compatible sync and compare object keys to `media` metadata.

Restore smoke test: create empty test D1, apply migrations, import export, point a test Worker to it and a fixture R2 bucket, then check home/admin/media. Use D1 Time Travel only according to the current plan retention; it is not a substitute for tested exports.
