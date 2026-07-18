#!/usr/bin/env bash
# Read-only R2 inventory via AWS CLI/S3 API. Requires a read-only R2 API token in the caller environment.
set -euo pipefail
BUCKET_NAME="${1:?Usage: scripts/r2-inventory.sh <bucket-name> <account-endpoint> [output.json]}"
ENDPOINT="${2:?Usage: scripts/r2-inventory.sh <bucket-name> <account-endpoint> [output.json]}"
OUTPUT="${3:-backups/r2-${BUCKET_NAME}-$(date -u +%Y%m%dT%H%M%SZ).json}"
command -v aws >/dev/null || { echo 'AWS CLI is required for an S3-compatible R2 inventory.' >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
aws --endpoint-url "$ENDPOINT" s3api list-objects-v2 --bucket "$BUCKET_NAME" --output json > "$OUTPUT"
printf 'Read-only R2 inventory saved to %s\n' "$OUTPUT"
