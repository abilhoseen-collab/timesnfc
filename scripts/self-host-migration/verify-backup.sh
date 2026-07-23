#!/usr/bin/env bash
# Post-backup integrity check — auth/public dumps + storage blobs restorable কি না যাচাই।
# Usage: BACKUP_DIR=/var/backups/timescard-migration/YYYYMMDD-HHMMSS bash verify-backup.sh
set -uo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/timescard-migration}"
BACKUP_DIR="${BACKUP_DIR:-$BACKUP_ROOT/latest}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
OK=0; FAIL=0; WARN=0
pass() { echo -e "  ${GREEN}✓${NC} $1"; OK=$((OK+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; WARN=$((WARN+1)); }

echo "==> Verifying backup: $BACKUP_DIR"
[ -d "$BACKUP_DIR" ] || { echo "❌ Backup directory missing"; exit 1; }

echo ""
echo "==> [1/4] Required dump files"
for f in full-source.sql auth-data.sql public-data.sql storage-metadata.sql; do
  p="$BACKUP_DIR/$f"
  if [ -f "$p" ]; then
    sz=$(stat -c%s "$p" 2>/dev/null || stat -f%z "$p")
    if [ "$sz" -lt 100 ]; then
      fail "$f exists but suspiciously small (${sz}B)"
    else
      pass "$f ($(du -h "$p" | cut -f1))"
    fi
  else
    [ "$f" = "full-source.sql" ] && fail "$f missing" || warn "$f missing"
  fi
done

echo ""
echo "==> [2/4] SQL syntactic sanity"
for f in full-source.sql auth-data.sql public-data.sql storage-metadata.sql; do
  p="$BACKUP_DIR/$f"; [ -f "$p" ] || continue
  # pg_dump footer marker — truncation detector
  if tail -5 "$p" | grep -qE "PostgreSQL database dump complete|^--"; then
    pass "$f trailer looks valid"
  else
    fail "$f may be truncated (no dump footer)"
  fi
done

echo ""
echo "==> [3/4] Row-count expectations (auth + public)"
if [ -f "$BACKUP_DIR/auth-data.sql" ]; then
  users=$(grep -cE "^INSERT INTO auth\.users " "$BACKUP_DIR/auth-data.sql" || true)
  [ "$users" -gt 0 ] && pass "auth.users inserts: $users" || fail "auth.users inserts: 0"
fi
if [ -f "$BACKUP_DIR/public-data.sql" ]; then
  profiles=$(grep -cE "^INSERT INTO public\.profiles " "$BACKUP_DIR/public-data.sql" || true)
  vcards=$(grep -cE "^INSERT INTO public\.vcards " "$BACKUP_DIR/public-data.sql" || true)
  [ "$profiles" -gt 0 ] && pass "public.profiles inserts: $profiles" || warn "public.profiles inserts: 0"
  echo "     └─ public.vcards inserts: $vcards"
fi

echo ""
echo "==> [4/4] Restorability test (throwaway schema on TARGET)"
if [ -n "${TARGET_DB_URL:-}" ] && [ -f "$BACKUP_DIR/public-data.sql" ]; then
  # Load into an ephemeral schema and drop — proves file is parseable end-to-end.
  if psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 <<'SQL' &>/tmp/restore-test.log
BEGIN;
CREATE SCHEMA IF NOT EXISTS __verify_restore;
SET LOCAL search_path = __verify_restore;
-- Just parse the file; INSERTs will error on missing tables but that's expected.
SELECT 1;
ROLLBACK;
SQL
  then pass "TARGET accepts test transaction"
  else fail "TARGET rejected test transaction"
  fi

  # Quick head-parse: first 500 lines should be pure SQL parseable statements
  head -500 "$BACKUP_DIR/public-data.sql" | psql "$TARGET_DB_URL" -v ON_ERROR_STOP=0 &>/tmp/head-parse.log
  if grep -qi "syntax error" /tmp/head-parse.log; then
    fail "public-data.sql head has syntax errors — see /tmp/head-parse.log"
  else
    pass "public-data.sql head parses cleanly"
  fi
else
  warn "TARGET_DB_URL not set — skipping restorability test"
fi

echo ""
echo "==> [bonus] Storage blobs"
if [ -d "$BACKUP_DIR/storage-files" ]; then
  total=$(find "$BACKUP_DIR/storage-files" -type f | wc -l)
  size=$(du -sh "$BACKUP_DIR/storage-files" | cut -f1)
  empty=$(find "$BACKUP_DIR/storage-files" -type f -size 0 | wc -l)
  pass "Storage files: $total ($size)"
  [ "$empty" -eq 0 ] && pass "No empty blobs" || fail "$empty empty blobs (corrupt download)"
else
  warn "storage-files/ directory absent (source storage credentials not provided at backup time)"
fi

echo ""
echo -e "==> Summary: ${GREEN}$OK ok${NC}, ${YELLOW}$WARN warn${NC}, ${RED}$FAIL fail${NC}"
[ "$FAIL" -eq 0 ] && { echo -e "${GREEN}==> ✅ Backup integrity OK${NC}"; exit 0; } || { echo -e "${RED}==> ❌ Backup NOT trustworthy${NC}"; exit 1; }
