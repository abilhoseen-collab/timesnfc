#!/usr/bin/env bash
# Phase 2: Schema + RLS + functions + triggers migrate to target DB
# Requires: TARGET_DB_URL env var
set -euo pipefail

: "${TARGET_DB_URL:?TARGET_DB_URL সেট করুন — postgresql://postgres:PASS@host:5432/postgres}"

MIGRATIONS_DIR="$(cd "$(dirname "$0")/../.." && pwd)/supabase/migrations"

echo "==> Migrations directory: $MIGRATIONS_DIR"
echo "==> Total files: $(ls "$MIGRATIONS_DIR"/*.sql | wc -l)"
echo ""

# Prereq: pg_cron, pg_net (schedule jobs + http from db)
echo "==> Enabling required extensions..."
psql "$TARGET_DB_URL" <<'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
SQL

echo ""
echo "==> Applying migrations in timestamp order..."
FAILED=0
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "  → $(basename "$f")"
  if ! psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$f" >/tmp/migration.log 2>&1; then
    echo "    ❌ FAILED. Log:"
    tail -30 /tmp/migration.log
    FAILED=1
    break
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo ""
  echo "==> ✅ সব migration সফল।"
  echo ""
  echo "==> Verification:"
  psql "$TARGET_DB_URL" -c "SELECT count(*) AS table_count FROM information_schema.tables WHERE table_schema='public';"
  psql "$TARGET_DB_URL" -c "SELECT count(*) AS policy_count FROM pg_policies WHERE schemaname='public';"
  psql "$TARGET_DB_URL" -c "SELECT count(*) AS function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public';"
else
  echo "==> ❌ Migration ব্যর্থ। উপরের log দেখুন।"
  exit 1
fi
