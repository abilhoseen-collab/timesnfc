#!/usr/bin/env bash
# Rebuild bundle/schema-bundle.sql from supabase/migrations/*.sql
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIG_DIR="$REPO_ROOT/supabase/migrations"
OUT_DIR="$REPO_ROOT/scripts/self-host-migration/bundle"
OUT="$OUT_DIR/schema-bundle.sql"

mkdir -p "$OUT_DIR"

COUNT=$(ls "$MIG_DIR"/*.sql | wc -l)

{
  echo "-- Consolidated schema bundle for timescard self-hosted Supabase"
  echo "-- Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "-- Source: supabase/migrations/*.sql (timestamp order, $COUNT files)"
  echo "-- Apply: psql \"\$TARGET_DB_URL\" -v ON_ERROR_STOP=1 -f schema-bundle.sql"
  echo ""
  echo "BEGIN;"
  echo ""
  echo "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
  echo "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
  echo "CREATE EXTENSION IF NOT EXISTS pg_cron;"
  echo "CREATE EXTENSION IF NOT EXISTS pg_net;"
  echo ""
  for f in "$MIG_DIR"/*.sql; do
    echo ""
    echo "-- ============================================================"
    echo "-- FILE: $(basename "$f")"
    echo "-- ============================================================"
    cat "$f"
    echo ""
  done
  echo ""
  echo "COMMIT;"
} > "$OUT"

echo "==> Bundle তৈরি: $OUT"
wc -l "$OUT"
du -h "$OUT"
