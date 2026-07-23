#!/usr/bin/env bash
# Phase 3: Source DB থেকে auth + public data dump
# Requires: SOURCE_DB_URL (Lovable Cloud support-এর কাছ থেকে পাবেন)
set -euo pipefail

: "${SOURCE_DB_URL:?SOURCE_DB_URL সেট করুন}"

OUT="${OUT:-/tmp/migration-dumps}"
mkdir -p "$OUT"

echo "==> Auth users dumping (bcrypt hash সহ)..."
pg_dump "$SOURCE_DB_URL" \
  --data-only \
  --no-owner --no-privileges \
  --column-inserts \
  -t auth.users -t auth.identities -t auth.mfa_factors \
  -t auth.mfa_challenges -t auth.mfa_amr_claims \
  -t auth.sessions -t auth.refresh_tokens \
  > "$OUT/01-auth.sql"

echo "==> Public schema data dumping..."
pg_dump "$SOURCE_DB_URL" \
  --data-only \
  --no-owner --no-privileges \
  --schema=public \
  --disable-triggers \
  --column-inserts \
  --exclude-table=public.rate_limits \
  > "$OUT/02-public.sql"

echo "==> Storage bucket rows dumping..."
pg_dump "$SOURCE_DB_URL" \
  --data-only \
  --no-owner --no-privileges \
  --column-inserts \
  -t storage.buckets \
  > "$OUT/03-storage-buckets.sql"

echo ""
echo "==> ✅ Dumps saved to: $OUT"
ls -lh "$OUT"
