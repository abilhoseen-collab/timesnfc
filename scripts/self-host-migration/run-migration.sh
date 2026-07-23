#!/usr/bin/env bash
# Master runner: env check → backup → schema-bundle.sql apply → report
# একটি command-এ সম্পূর্ণ VPS migration শুরু করে।
#
# Usage:
#   export TARGET_DB_URL="postgresql://postgres:PASS@localhost:5432/postgres"
#   export SOURCE_DB_URL="postgresql://..."   # backup-এর জন্য (optional)
#   bash run-migration.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TS="$(date -u +%Y%m%d-%H%M%S)"
REPORT_DIR="${REPORT_DIR:-$SCRIPT_DIR/reports}"
mkdir -p "$REPORT_DIR"
REPORT="$REPORT_DIR/migration-$TS.log"
SUMMARY="$REPORT_DIR/migration-$TS.summary.md"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Everything to stdout + logfile
exec > >(tee -a "$REPORT") 2>&1

STEPS=()   # step_name|status|duration_sec|note

log_step() {
  local name="$1" status="$2" dur="$3" note="${4:-}"
  STEPS+=("$name|$status|$dur|$note")
}

run_step() {
  local name="$1"; shift
  local start end dur rc
  echo ""
  echo -e "${BLUE}━━━ [$name] শুরু ($(date -u +%H:%M:%S UTC)) ━━━${NC}"
  start=$(date +%s)
  if "$@"; then
    rc=0
  else
    rc=$?
  fi
  end=$(date +%s)
  dur=$((end - start))
  if [ "$rc" -eq 0 ]; then
    echo -e "${GREEN}✓ [$name] সফল (${dur}s)${NC}"
    log_step "$name" "OK" "$dur"
    return 0
  else
    echo -e "${RED}✗ [$name] ব্যর্থ (exit=$rc, ${dur}s)${NC}"
    log_step "$name" "FAIL" "$dur" "exit=$rc"
    return "$rc"
  fi
}

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Timescard Self-Hosted Migration — $TS  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo "Report: $REPORT"
echo ""

OVERALL_START=$(date +%s)
FAILED_STEP=""

# 1. Env check
if ! run_step "env-check" bash "$SCRIPT_DIR/00-env-check.sh"; then
  FAILED_STEP="env-check"
fi

# 2. Backup source (SOURCE_DB_URL থাকলে)
if [ -z "$FAILED_STEP" ]; then
  if [ -n "${SOURCE_DB_URL:-}" ]; then
    run_step "backup-source" bash "$SCRIPT_DIR/backup-source.sh" || FAILED_STEP="backup-source"
  else
    echo -e "${YELLOW}⚠ SOURCE_DB_URL সেট নেই — backup skip${NC}"
    log_step "backup-source" "SKIP" "0" "SOURCE_DB_URL missing"
  fi
fi

# 3. schema-bundle.sql apply
if [ -z "$FAILED_STEP" ]; then
  BUNDLE="$SCRIPT_DIR/bundle/schema-bundle.sql"
  if [ ! -f "$BUNDLE" ]; then
    echo "==> Bundle নেই — build করা হচ্ছে..."
    bash "$SCRIPT_DIR/build-bundle.sh"
  fi
  run_step "schema-bundle-apply" \
    psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$BUNDLE" \
    || FAILED_STEP="schema-bundle-apply"
fi

# 4. Verification
if [ -z "$FAILED_STEP" ]; then
  run_step "verify" bash -c '
    psql "$TARGET_DB_URL" -c "SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema='\''public'\'';"
    psql "$TARGET_DB_URL" -c "SELECT count(*) AS policies FROM pg_policies WHERE schemaname='\''public'\'';"
    psql "$TARGET_DB_URL" -c "SELECT count(*) AS functions FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='\''public'\'';"
  ' || FAILED_STEP="verify"
fi

OVERALL_END=$(date +%s)
TOTAL_DUR=$((OVERALL_END - OVERALL_START))

# ── Report ───────────────────────────────────────
{
  echo "# Migration Report — $TS"
  echo ""
  echo "- **Total duration**: ${TOTAL_DUR}s"
  echo "- **Overall status**: $([ -z "$FAILED_STEP" ] && echo '✅ SUCCESS' || echo "❌ FAILED at $FAILED_STEP")"
  echo "- **Full log**: \`$REPORT\`"
  echo ""
  echo "## Steps"
  echo ""
  echo "| Step | Status | Duration | Note |"
  echo "|------|--------|----------|------|"
  for s in "${STEPS[@]}"; do
    IFS='|' read -r name status dur note <<< "$s"
    icon="✓"; [ "$status" = "FAIL" ] && icon="✗"; [ "$status" = "SKIP" ] && icon="⊘"
    echo "| $name | $icon $status | ${dur}s | $note |"
  done
  echo ""
  if [ -n "$FAILED_STEP" ]; then
    echo "## Rollback"
    echo ""
    echo "\`\`\`bash"
    echo "bash $SCRIPT_DIR/rollback.sh"
    echo "\`\`\`"
  else
    echo "## পরবর্তী step"
    echo ""
    echo "1. \`bash 03-dump-source.sh\` — source data dump"
    echo "2. \`bash 04-restore-data.sh\` — target-এ data restore"
    echo "3. \`bash 05-migrate-storage.sh\` — storage files"
    echo "4. \`bash 06-deploy-functions.sh\` — edge functions"
    echo "5. \`psql \$TARGET_DB_URL -f 07-cron-jobs.sql\`"
    echo "6. \`bash 08-smoke-test.sh\`"
  fi
} > "$SUMMARY"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "$SUMMARY"
echo ""
echo "Summary: $SUMMARY"
echo "Log:     $REPORT"

[ -z "$FAILED_STEP" ] || exit 1
