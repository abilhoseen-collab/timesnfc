#!/usr/bin/env bash
# Phase 0: প্রয়োজনীয় environment variables + dependencies যাচাই
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
OK=0; FAIL=0; WARN=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; OK=$((OK+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; WARN=$((WARN+1)); }

echo "==> Dependency check"
for cmd in psql pg_dump curl jq docker git bash tar; do
  if command -v "$cmd" &>/dev/null; then
    pass "$cmd installed ($(command -v "$cmd"))"
  else
    fail "$cmd missing — install করুন"
  fi
done

echo ""
echo "==> Optional tools"
for cmd in supabase deno; do
  if command -v "$cmd" &>/dev/null; then
    pass "$cmd available"
  else
    warn "$cmd missing (edge function deploy-এর জন্য দরকার হতে পারে)"
  fi
done

echo ""
echo "==> Required environment variables"
check_var() {
  local name="$1"; local required="${2:-true}"
  if [ -n "${!name:-}" ]; then
    pass "$name সেট আছে"
  elif [ "$required" = "true" ]; then
    fail "$name সেট নেই"
  else
    warn "$name সেট নেই (optional)"
  fi
}

check_var TARGET_DB_URL true
check_var SOURCE_DB_URL false
check_var SOURCE_SUPABASE_URL false
check_var SOURCE_SERVICE_KEY false
check_var TARGET_SUPABASE_URL false
check_var TARGET_SERVICE_KEY false

echo ""
echo "==> Connectivity check"
if [ -n "${TARGET_DB_URL:-}" ]; then
  if psql "$TARGET_DB_URL" -c "SELECT 1" &>/dev/null; then
    pass "TARGET_DB_URL reachable"
  else
    fail "TARGET_DB_URL connect ব্যর্থ"
  fi
fi
if [ -n "${SOURCE_DB_URL:-}" ]; then
  if psql "$SOURCE_DB_URL" -c "SELECT 1" &>/dev/null; then
    pass "SOURCE_DB_URL reachable"
  else
    warn "SOURCE_DB_URL connect ব্যর্থ (backup/dump লাগবে না হলে skip)"
  fi
fi

echo ""
echo "==> Summary: ${GREEN}$OK ok${NC}, ${YELLOW}$WARN warn${NC}, ${RED}$FAIL fail${NC}"
[ "$FAIL" -eq 0 ] || { echo -e "${RED}==> সমস্যা fix করে আবার চালান।${NC}"; exit 1; }
echo -e "${GREEN}==> ✅ সব prerequisite OK — migration শুরু করা যাবে।${NC}"
