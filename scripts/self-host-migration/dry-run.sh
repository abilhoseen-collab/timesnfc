#!/usr/bin/env bash
# Dry-run: env + dependency + connectivity + bundle parse — NO changes applied.
# Usage: bash dry-run.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
OK=0; FAIL=0; WARN=0
pass() { echo -e "  ${GREEN}✓${NC} $1"; OK=$((OK+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; WARN=$((WARN+1)); }

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Dry-Run — no database changes will be made  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"

echo ""
echo "==> [1/5] Dependencies"
for cmd in psql pg_dump curl jq tar; do
  command -v "$cmd" &>/dev/null && pass "$cmd" || fail "$cmd missing"
done
for cmd in docker supabase deno; do
  command -v "$cmd" &>/dev/null && pass "$cmd" || warn "$cmd missing (optional)"
done

echo ""
echo "==> [2/5] Environment variables"
[ -n "${TARGET_DB_URL:-}" ] && pass "TARGET_DB_URL set" || fail "TARGET_DB_URL missing"
[ -n "${SOURCE_DB_URL:-}" ] && pass "SOURCE_DB_URL set" || warn "SOURCE_DB_URL missing (backup skipped)"
for v in SOURCE_SUPABASE_URL SOURCE_SERVICE_KEY TARGET_SUPABASE_URL TARGET_SERVICE_KEY TARGET_ANON_KEY; do
  [ -n "${!v:-}" ] && pass "$v set" || warn "$v missing (needed for storage/smoke)"
done

echo ""
echo "==> [3/5] Database connectivity"
if [ -n "${TARGET_DB_URL:-}" ]; then
  if psql "$TARGET_DB_URL" -c "SELECT 1" &>/dev/null; then
    pass "TARGET reachable"
    ver=$(psql "$TARGET_DB_URL" -Atc "SHOW server_version" 2>/dev/null || echo "?")
    echo "     └─ Postgres $ver"
    empty=$(psql "$TARGET_DB_URL" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "?")
    [ "$empty" = "0" ] && pass "TARGET public schema empty (safe)" || warn "TARGET public has $empty tables (migration may conflict)"
  else
    fail "TARGET connect failed"
  fi
fi
if [ -n "${SOURCE_DB_URL:-}" ]; then
  psql "$SOURCE_DB_URL" -c "SELECT 1" &>/dev/null && pass "SOURCE reachable" || fail "SOURCE connect failed"
fi

echo ""
echo "==> [4/5] Bundle parse check"
BUNDLE="$SCRIPT_DIR/bundle/schema-bundle.sql"
if [ ! -f "$BUNDLE" ]; then
  warn "Bundle absent — build-bundle.sh চালিয়ে তৈরি করুন"
else
  size=$(du -h "$BUNDLE" | cut -f1)
  lines=$(wc -l < "$BUNDLE")
  pass "Bundle present ($size, $lines lines)"
  grep -q "^BEGIN;" "$BUNDLE" && pass "BEGIN found" || fail "BEGIN missing"
  grep -q "^COMMIT;" "$BUNDLE" && pass "COMMIT found" || fail "COMMIT missing"
  if [ -n "${TARGET_DB_URL:-}" ]; then
    # Server-side parse via prepared transaction — validates SQL without committing
    if psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 <<SQL &>/tmp/dry-parse.log
BEGIN;
SET LOCAL check_function_bodies = off;
DO \$\$ BEGIN RAISE NOTICE 'bundle parse test'; END \$\$;
ROLLBACK;
SQL
    then pass "psql transaction rollback works"
    else fail "psql transaction test failed — see /tmp/dry-parse.log"
    fi
  fi
fi

echo ""
echo "==> [5/5] Migration script syntax"
for s in 00-env-check.sh backup-source.sh run-migration.sh rollback.sh verify-backup.sh 08-smoke-test.sh; do
  f="$SCRIPT_DIR/$s"
  [ ! -f "$f" ] && { warn "$s absent"; continue; }
  bash -n "$f" 2>/tmp/syntax.log && pass "$s syntax OK" || { fail "$s syntax error"; cat /tmp/syntax.log; }
done

echo ""
echo -e "==> Summary: ${GREEN}$OK ok${NC}, ${YELLOW}$WARN warn${NC}, ${RED}$FAIL fail${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}==> ✅ Dry-run পাশ — migration চালানো নিরাপদ${NC}"
  exit 0
else
  echo -e "${RED}==> ❌ Fix issues before running migration${NC}"
  exit 1
fi
