#!/usr/bin/env bash
# Export a remote D1 database. Run only with an explicit database name.
set -euo pipefail
DATABASE_NAME="${1:?Usage: scripts/backup-d1.sh <database-name> [output.sql]}"
OUTPUT="${2:-backups/d1-${DATABASE_NAME}-$(date -u +%Y%m%dT%H%M%SZ).sql}"
mkdir -p "$(dirname "$OUTPUT")"
pnpm exec wrangler d1 export "$DATABASE_NAME" --remote --output "$OUTPUT"
printf 'D1 export saved to %s\n' "$OUTPUT"
