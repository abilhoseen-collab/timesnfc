#!/usr/bin/env bash
# Phase 5: Storage buckets & files copy source → target via Storage REST API
set -euo pipefail

: "${SOURCE_SUPABASE_URL:?}"
: "${SOURCE_SERVICE_KEY:?}"
: "${TARGET_SUPABASE_URL:?}"
: "${TARGET_SERVICE_KEY:?}"

BUCKETS=("profile-photos" "qr-logos" "landing-page-assets" "payment-screenshots")
TMP="${TMP:-/tmp/bucket-sync}"
mkdir -p "$TMP"

for bucket in "${BUCKETS[@]}"; do
  echo "==> Bucket: $bucket"
  mkdir -p "$TMP/$bucket"

  # Recursive list via Storage API (returns 100 items per page)
  offset=0
  while :; do
    resp=$(curl -sS -X POST \
      -H "Authorization: Bearer $SOURCE_SERVICE_KEY" \
      -H "apikey: $SOURCE_SERVICE_KEY" \
      -H "Content-Type: application/json" \
      "$SOURCE_SUPABASE_URL/storage/v1/object/list/$bucket" \
      -d "{\"prefix\":\"\",\"limit\":100,\"offset\":$offset}")

    count=$(echo "$resp" | jq 'length')
    [ "$count" -eq 0 ] && break

    echo "$resp" | jq -r '.[].name' | while read -r name; do
      [ -z "$name" ] && continue
      # Download
      curl -sS -o "$TMP/$bucket/$(basename "$name")" \
        -H "Authorization: Bearer $SOURCE_SERVICE_KEY" \
        "$SOURCE_SUPABASE_URL/storage/v1/object/$bucket/$name"

      # Upload to target
      curl -sS -X POST \
        -H "Authorization: Bearer $TARGET_SERVICE_KEY" \
        -H "apikey: $TARGET_SERVICE_KEY" \
        --data-binary "@$TMP/$bucket/$(basename "$name")" \
        "$TARGET_SUPABASE_URL/storage/v1/object/$bucket/$name" >/dev/null

      echo "    ✓ $name"
    done

    offset=$((offset + count))
    [ "$count" -lt 100 ] && break
  done
done

echo ""
echo "==> ✅ Storage migration সম্পন্ন। Files: $TMP"
