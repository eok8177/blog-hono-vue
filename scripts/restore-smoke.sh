#!/usr/bin/env bash
# Manual guardrail for restore drills. It never touches a remote database.
set -euo pipefail
DATABASE_NAME="${1:?Usage: scripts/restore-smoke.sh <local-test-database> <export.sql>}"
EXPORT_FILE="${2:?Usage: scripts/restore-smoke.sh <local-test-database> <export.sql>}"
[ -f "$EXPORT_FILE" ] || { echo "Export not found: $EXPORT_FILE" >&2; exit 1; }
pnpm exec wrangler d1 migrations apply "$DATABASE_NAME" --local
pnpm exec wrangler d1 execute "$DATABASE_NAME" --local --file "$EXPORT_FILE"
printf 'Restore import completed. Start the Worker with a dedicated test binding and smoke-test public/admin routes.\n'
