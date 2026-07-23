#!/usr/bin/env bash
# Phase 8: Post-migration smoke test — Auth, REST, Storage, Edge Functions
# Exits non-zero on any failure so run-migration.sh can gate success.
set -uo pipefail

: "${TARGET_SUPABASE_URL:?TARGET_SUPABASE_URL missing}"
: "${TARGET_ANON_KEY:?TARGET_ANON_KEY missing}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
OK=0; FAIL=0
pass() { echo -e "  ${GREEN}✓${NC} $1"; OK=$((OK+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }

URL="${TARGET_SUPABASE_URL%/}"

check_http() {
  local label="$1" url="$2" expect="$3" extra="${4:-}"
  local code
  code=$(curl -sS -o /tmp/smoke-body.txt -w '%{http_code}' $extra "$url" 2>/dev/null || echo "000")
  if [[ "$expect" == *"$code"* ]]; then
    pass "$label ($code)"
  else
    fail "$label expected [$expect] got $code"
    head -c 200 /tmp/smoke-body.txt 2>/dev/null; echo
  fi
}

echo "==> [1/4] Auth health"
check_http "auth /health" "$URL/auth/v1/health" "200"

echo ""
echo "==> [2/4] REST (PostgREST)"
check_http "rest root" "$URL/rest/v1/" "200 404" "-H apikey:$TARGET_ANON_KEY"
check_http "rest profiles read" "$URL/rest/v1/profiles?select=id&limit=1" "200 401 403" \
  "-H apikey:$TARGET_ANON_KEY -H Authorization:Bearer\ $TARGET_ANON_KEY"

echo ""
echo "==> [3/4] Storage buckets"
resp=$(curl -sS "$URL/storage/v1/bucket" -H "apikey: $TARGET_ANON_KEY" -H "Authorization: Bearer $TARGET_ANON_KEY" 2>/dev/null)
if echo "$resp" | jq empty 2>/dev/null; then
  names=$(echo "$resp" | jq -r '.[].name' 2>/dev/null | sort | tr '\n' ' ')
  for b in profile-photos qr-logos landing-page-assets payment-screenshots; do
    if echo " $names " | grep -q " $b "; then pass "bucket $b"; else fail "bucket $b missing"; fi
  done
else
  fail "storage list returned non-JSON: $(echo "$resp" | head -c 200)"
fi

echo ""
echo "==> [4/4] Edge functions reachable"
for fn in send-notification vcard-og-image weekly-digest; do
  check_http "fn $fn OPTIONS" "$URL/functions/v1/$fn" "200 204 401 405" \
    "-X OPTIONS -H apikey:$TARGET_ANON_KEY"
done

echo ""
echo -e "==> Smoke test: ${GREEN}$OK ok${NC}, ${RED}$FAIL fail${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}==> ✅ All smoke checks passed${NC}"
  exit 0
else
  echo -e "${RED}==> ❌ Smoke test failed${NC}"
  exit 1
fi
