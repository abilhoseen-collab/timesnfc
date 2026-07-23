#!/usr/bin/env bash
# Migration-এর আগে source DB (auth + public + storage buckets) + storage files backup
# rollback.sh এই backup থেকে restore করবে।
set -euo pipefail

: "${SOURCE_DB_URL:?SOURCE_DB_URL সেট করুন}"

TS="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/timescard-migration}"
DIR="$BACKUP_ROOT/$TS"
mkdir -p "$DIR"

echo "==> Backup directory: $DIR"

echo "==> [1/4] Full schema+data dump (safety net)..."
pg_dump "$SOURCE_DB_URL" --no-owner --no-privileges --clean --if-exists \
  --file="$DIR/full-source.sql"

echo "==> [2/4] Auth schema (users + identities + sessions)..."
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges --column-inserts \
  -t auth.users -t auth.identities -t auth.mfa_factors \
  -t auth.mfa_challenges -t auth.mfa_amr_claims \
  -t auth.sessions -t auth.refresh_tokens \
  --file="$DIR/auth-data.sql"

echo "==> [3/4] Public schema data..."
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges \
  --schema=public --disable-triggers --column-inserts \
  --exclude-table=public.rate_limits \
  --file="$DIR/public-data.sql"

echo "==> [4/4] Storage bucket metadata + objects..."
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges --column-inserts \
  -t storage.buckets -t storage.objects \
  --file="$DIR/storage-metadata.sql"

# Storage file blobs — যদি SOURCE_SUPABASE_URL + SERVICE_KEY দেওয়া থাকে
if [ -n "${SOURCE_SUPABASE_URL:-}" ] && [ -n "${SOURCE_SERVICE_KEY:-}" ]; then
  echo "==> [bonus] Storage file blobs download..."
  mkdir -p "$DIR/storage-files"
  for bucket in profile-photos qr-logos landing-page-assets payment-screenshots; do
    mkdir -p "$DIR/storage-files/$bucket"
    offset=0
    while :; do
      resp=$(curl -sS -X POST \
        -H "Authorization: Bearer $SOURCE_SERVICE_KEY" \
        -H "apikey: $SOURCE_SERVICE_KEY" -H "Content-Type: application/json" \
        "$SOURCE_SUPABASE_URL/storage/v1/object/list/$bucket" \
        -d "{\"prefix\":\"\",\"limit\":100,\"offset\":$offset}")
      count=$(echo "$resp" | jq 'length')
      [ "$count" -eq 0 ] && break
      echo "$resp" | jq -r '.[].name' | while read -r name; do
        [ -z "$name" ] && continue
        curl -sS -o "$DIR/storage-files/$bucket/$(basename "$name")" \
          -H "Authorization: Bearer $SOURCE_SERVICE_KEY" \
          "$SOURCE_SUPABASE_URL/storage/v1/object/$bucket/$name"
      done
      offset=$((offset + count))
      [ "$count" -lt 100 ] && break
    done
  done
fi

echo "==> Compressing..."
tar -czf "$DIR.tar.gz" -C "$BACKUP_ROOT" "$TS"
BACKUP_SIZE=$(du -h "$DIR.tar.gz" | cut -f1)

# Latest symlink — rollback.sh এটাই default use করবে
ln -sfn "$DIR" "$BACKUP_ROOT/latest"
ln -sfn "$DIR.tar.gz" "$BACKUP_ROOT/latest.tar.gz"

echo ""
echo "==> ✅ Backup সম্পন্ন"
echo "    Directory: $DIR"
echo "    Archive:   $DIR.tar.gz ($BACKUP_SIZE)"
echo "    Latest:    $BACKUP_ROOT/latest"
echo ""
echo "==> Rollback করতে: BACKUP_DIR=$DIR bash rollback.sh"
