#!/usr/bin/env bash
# Phase 8: Post-migration smoke test
set -euo pipefail

: "${TARGET_SUPABASE_URL:?}"
: "${TARGET_ANON_KEY:?}"

echo "==> Auth health..."
curl -fsS "$TARGET_SUPABASE_URL/auth/v1/health" | jq .

echo ""
echo "==> REST reachability (public read on profiles)..."
curl -fsS "$TARGET_SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $TARGET_ANON_KEY" | jq .

echo ""
echo "==> Storage list buckets..."
curl -fsS "$TARGET_SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $TARGET_ANON_KEY" \
  -H "Authorization: Bearer $TARGET_ANON_KEY" | jq '.[].name'

echo ""
echo "==> Edge function ping (send-notification OPTIONS)..."
curl -fsS -X OPTIONS "$TARGET_SUPABASE_URL/functions/v1/send-notification" \
  -H "apikey: $TARGET_ANON_KEY" -w '\nStatus: %{http_code}\n'

echo ""
echo "==> ✅ Smoke test সম্পন্ন। এবার Lovable frontend-এ .env update করুন।"
