#!/usr/bin/env bash
# Master runner: dry-run | env-check → backup → verify-backup → schema apply → smoke test → report
# Auto-rollback on any failure. Records failure cause in markdown summary.
#
# Usage:
#   bash run-migration.sh --dry-run    # validate only, no changes
#   bash run-migration.sh              # full migration + smoke test + auto-rollback on fail
#   AUTO_ROLLBACK=false bash run-migration.sh   # disable rollback (debug)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TS="$(date -u +%Y%m%d-%H%M%S)"
REPORT_DIR="${REPORT_DIR:-$SCRIPT_DIR/reports}"
mkdir -p "$REPORT_DIR"
REPORT="$REPORT_DIR/migration-$TS.log"
SUMMARY="$REPORT_DIR/migration-$TS.summary.md"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

DRY_RUN=false
AUTO_ROLLBACK="${AUTO_ROLLBACK:-true}"
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --no-rollback) AUTO_ROLLBACK=false ;;
  esac
done

exec > >(tee -a "$REPORT") 2>&1

STEPS=()
FAILURE_CAUSE=""

log_step() { STEPS+=("$1|$2|$3|${4:-}"); }

run_step() {
  local name="$1"; shift
  local start end dur rc
  echo ""
  echo -e "${BLUE}━━━ [$name] শুরু ($(date -u +%H:%M:%S UTC)) ━━━${NC}"
  start=$(date +%s)
  "$@"; rc=$?
  end=$(date +%s); dur=$((end - start))
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
if $DRY_RUN; then
  echo -e "${BLUE}║   Timescard Migration — DRY RUN — $TS  ║${NC}"
else
  echo -e "${BLUE}║  Timescard Migration — LIVE APPLY — $TS ║${NC}"
fi
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo "Report: $REPORT"
echo "Auto-rollback: $AUTO_ROLLBACK"
echo ""

OVERALL_START=$(date +%s)
FAILED_STEP=""

# ── DRY RUN: validate everything, apply nothing ──
if $DRY_RUN; then
  run_step "dry-run" bash "$SCRIPT_DIR/dry-run.sh" || { FAILED_STEP="dry-run"; FAILURE_CAUSE="Dry-run validation failed — see log"; }
else
  # 1. Env check
  run_step "env-check" bash "$SCRIPT_DIR/00-env-check.sh" || { FAILED_STEP="env-check"; FAILURE_CAUSE="Environment / dependency check failed"; }

  # 2. Backup source
  if [ -z "$FAILED_STEP" ]; then
    if [ -n "${SOURCE_DB_URL:-}" ]; then
      run_step "backup-source" bash "$SCRIPT_DIR/backup-source.sh" \
        || { FAILED_STEP="backup-source"; FAILURE_CAUSE="Source backup failed"; }
    else
      echo -e "${YELLOW}⚠ SOURCE_DB_URL missing — backup skipped (auto-rollback will be disabled)${NC}"
      log_step "backup-source" "SKIP" "0" "SOURCE_DB_URL missing"
      AUTO_ROLLBACK=false
    fi
  fi

  # 3. Verify backup integrity
  if [ -z "$FAILED_STEP" ] && [ -n "${SOURCE_DB_URL:-}" ]; then
    run_step "verify-backup" bash "$SCRIPT_DIR/verify-backup.sh" \
      || { FAILED_STEP="verify-backup"; FAILURE_CAUSE="Backup integrity check failed — DO NOT proceed"; }
  fi

  # 4. Bundle apply
  if [ -z "$FAILED_STEP" ]; then
    BUNDLE="$SCRIPT_DIR/bundle/schema-bundle.sql"
    [ -f "$BUNDLE" ] || { echo "==> Building bundle..."; bash "$SCRIPT_DIR/build-bundle.sh"; }
    run_step "schema-bundle-apply" \
      psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$BUNDLE" \
      || { FAILED_STEP="schema-bundle-apply"; FAILURE_CAUSE="Schema bundle apply failed on TARGET"; }
  fi

  # 5. DB verification
  if [ -z "$FAILED_STEP" ]; then
    run_step "verify-schema" bash -c '
      psql "$TARGET_DB_URL" -c "SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema='\''public'\'';"
      psql "$TARGET_DB_URL" -c "SELECT count(*) AS policies FROM pg_policies WHERE schemaname='\''public'\'';"
      psql "$TARGET_DB_URL" -c "SELECT count(*) AS functions FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='\''public'\'';"
    ' || { FAILED_STEP="verify-schema"; FAILURE_CAUSE="Post-apply verification failed"; }
  fi

  # 6. Smoke test (needs runtime URLs)
  if [ -z "$FAILED_STEP" ]; then
    if [ -n "${TARGET_SUPABASE_URL:-}" ] && [ -n "${TARGET_ANON_KEY:-}" ]; then
      run_step "smoke-test" bash "$SCRIPT_DIR/08-smoke-test.sh" \
        || { FAILED_STEP="smoke-test"; FAILURE_CAUSE="Post-migration smoke test failed (Auth/REST/Storage/Functions)"; }
    else
      echo -e "${YELLOW}⚠ TARGET_SUPABASE_URL / TARGET_ANON_KEY missing — smoke test skipped${NC}"
      log_step "smoke-test" "SKIP" "0" "runtime URLs missing"
    fi
  fi

  # 7. AUTO-ROLLBACK on failure
  ROLLBACK_STATUS=""
  if [ -n "$FAILED_STEP" ] && [ "$AUTO_ROLLBACK" = "true" ]; then
    echo ""
    echo -e "${YELLOW}==> Auto-rollback triggered (failed step: $FAILED_STEP)${NC}"
    if BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../../../var/backups/timescard-migration/latest}" \
       yes yes | bash "$SCRIPT_DIR/rollback.sh"; then
      ROLLBACK_STATUS="OK"
      log_step "auto-rollback" "OK" "0" "restored from backup"
      echo -e "${GREEN}==> ✓ Rollback সফল${NC}"
    else
      ROLLBACK_STATUS="FAIL"
      log_step "auto-rollback" "FAIL" "0" "manual intervention required"
      echo -e "${RED}==> ✗ Rollback ব্যর্থ — manually restore from backup${NC}"
    fi
  fi
fi

OVERALL_END=$(date +%s)
TOTAL_DUR=$((OVERALL_END - OVERALL_START))

# ── Report ──
{
  echo "# Migration Report — $TS"
  echo ""
  echo "- **Mode**: $($DRY_RUN && echo 'DRY RUN' || echo 'LIVE APPLY')"
  echo "- **Total duration**: ${TOTAL_DUR}s"
  echo "- **Overall status**: $([ -z "$FAILED_STEP" ] && echo '✅ SUCCESS' || echo "❌ FAILED at \`$FAILED_STEP\`")"
  [ -n "$FAILURE_CAUSE" ] && echo "- **Failure cause**: $FAILURE_CAUSE"
  [ -n "${ROLLBACK_STATUS:-}" ] && echo "- **Auto-rollback**: $ROLLBACK_STATUS"
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
    echo "## Recovery"
    echo ""
    if [ "${ROLLBACK_STATUS:-}" = "OK" ]; then
      echo "Target DB has been restored from backup. Investigate the failure above, then re-run migration."
    elif [ "${ROLLBACK_STATUS:-}" = "FAIL" ]; then
      echo "⚠️ Auto-rollback failed. Manually restore:"
      echo '```bash'
      echo "BACKUP_DIR=/var/backups/timescard-migration/latest bash $SCRIPT_DIR/rollback.sh"
      echo '```'
    else
      echo "Auto-rollback disabled or no backup available. If needed:"
      echo '```bash'
      echo "bash $SCRIPT_DIR/rollback.sh"
      echo '```'
    fi
  elif ! $DRY_RUN; then
    echo "## Next steps"
    echo ""
    echo "1. \`bash 03-dump-source.sh\` — dump source data"
    echo "2. \`bash 04-restore-data.sh\` — restore rows to TARGET"
    echo "3. \`bash 05-migrate-storage.sh\` — copy storage blobs"
    echo "4. \`bash 06-deploy-functions.sh\` — deploy edge functions"
    echo "5. \`psql \$TARGET_DB_URL -f 07-cron-jobs.sql\` — schedule cron"
  fi
} > "$SUMMARY"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "$SUMMARY"
echo ""
echo "Summary: $SUMMARY"
echo "Log:     $REPORT"

[ -z "$FAILED_STEP" ] || exit 1
