#!/usr/bin/env bash
# Backup থেকে target DB রোলব্যাক — মাইগ্রেশন ব্যর্থ হলে বা revert করতে হলে
# Usage: BACKUP_DIR=/var/backups/timescard-migration/YYYYMMDD-HHMMSS bash rollback.sh
# অথবা:  bash rollback.sh (latest symlink use করবে)
set -euo pipefail

: "${TARGET_DB_URL:?TARGET_DB_URL সেট করুন}"

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/timescard-migration}"
BACKUP_DIR="${BACKUP_DIR:-$BACKUP_ROOT/latest}"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Backup directory পাওয়া যায়নি: $BACKUP_DIR"
  echo "   backup-source.sh আগে চালিয়েছেন?"
  exit 1
fi

echo "==> Rollback source: $BACKUP_DIR"
echo "==> Target DB: (host থেকে পড়া হচ্ছে)"
echo ""
echo "⚠️  এটি target DB-এর public + storage schema পুরোপুরি বদলে দেবে।"
read -r -p "চালিয়ে যাবেন? (yes/no): " confirm
[ "$confirm" = "yes" ] || { echo "বাতিল।"; exit 0; }

LOG="$BACKUP_DIR/rollback-$(date -u +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

echo ""
echo "==> [1/3] Public schema drop + full restore..."
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
SQL

if [ -f "$BACKUP_DIR/full-source.sql" ]; then
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$BACKUP_DIR/full-source.sql"
else
  echo "   full-source.sql নেই — auth + public + storage আলাদাভাবে restore করা হচ্ছে"
  [ -f "$BACKUP_DIR/auth-data.sql" ] && psql "$TARGET_DB_URL" -f "$BACKUP_DIR/auth-data.sql"
  [ -f "$BACKUP_DIR/public-data.sql" ] && psql "$TARGET_DB_URL" -f "$BACKUP_DIR/public-data.sql"
  [ -f "$BACKUP_DIR/storage-metadata.sql" ] && psql "$TARGET_DB_URL" -f "$BACKUP_DIR/storage-metadata.sql"
fi

echo "==> [2/3] Sequence reset..."
psql "$TARGET_DB_URL" <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS s, c.relname AS t, a.attname AS col,
           pg_get_serial_sequence(n.nspname||'.'||c.relname, a.attname) AS seq
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid
    WHERE n.nspname='public'
      AND pg_get_serial_sequence(n.nspname||'.'||c.relname, a.attname) IS NOT NULL
  LOOP
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 1))',
      r.seq, r.col, r.s, r.t);
  END LOOP;
END $$;
SQL

echo "==> [3/3] Verification..."
psql "$TARGET_DB_URL" -c "SELECT count(*) AS users FROM auth.users;" || true
psql "$TARGET_DB_URL" -c "SELECT count(*) AS profiles FROM public.profiles;" || true
psql "$TARGET_DB_URL" -c "SELECT count(*) AS vcards FROM public.vcards;" || true

echo ""
echo "==> ✅ Rollback সম্পন্ন। Log: $LOG"
