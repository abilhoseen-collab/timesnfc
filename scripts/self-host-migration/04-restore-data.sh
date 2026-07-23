#!/usr/bin/env bash
# Phase 4: Target DB-তে auth + public data restore
set -euo pipefail

: "${TARGET_DB_URL:?TARGET_DB_URL সেট করুন}"
DUMP_DIR="${DUMP_DIR:-/tmp/migration-dumps}"

for f in 01-auth.sql 02-public.sql 03-storage-buckets.sql; do
  echo "==> Restoring $f..."
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$DUMP_DIR/$f"
done

echo ""
echo "==> Sequences reset (avoid duplicate PK errors on next insert)..."
psql "$TARGET_DB_URL" <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, columnname, pg_get_serial_sequence(schemaname||'.'||tablename, columnname) AS seq
    FROM (
      SELECT ns.nspname AS schemaname, c.relname AS tablename, a.attname AS columnname
      FROM pg_class c
      JOIN pg_namespace ns ON ns.oid=c.relnamespace
      JOIN pg_attribute a ON a.attrelid=c.oid
      WHERE ns.nspname='public'
        AND pg_get_serial_sequence(ns.nspname||'.'||c.relname, a.attname) IS NOT NULL
    ) s
  LOOP
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 1))',
      r.seq, r.columnname, r.schemaname, r.tablename);
  END LOOP;
END $$;
SQL

echo ""
echo "==> ✅ Data restore সম্পন্ন।"
psql "$TARGET_DB_URL" -c "SELECT count(*) AS users FROM auth.users;"
psql "$TARGET_DB_URL" -c "SELECT count(*) AS profiles FROM public.profiles;"
psql "$TARGET_DB_URL" -c "SELECT count(*) AS vcards FROM public.vcards;"
