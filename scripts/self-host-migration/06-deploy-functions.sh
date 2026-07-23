#!/usr/bin/env bash
# Phase 6: 21 edge functions deploy to self-hosted Supabase
set -euo pipefail

: "${TARGET_PROJECT_REF:?}"   # self-host-এ যেকোনো string, ex: "timescard"
: "${TARGET_ACCESS_TOKEN:?}"  # Studio access token
: "${TARGET_DB_URL:?}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

FUNCTIONS=(
  appointment-reminders create-user-account delete-user-account
  dispatch-integrations enhance-image generate-invoice
  generate-vcard-bio lead-followup-reminders
  send-appointment-notification send-contact-notification
  send-notification send-payment-notification
  send-team-invitation send-web-push
  subscription-expiry-notification twilio-send-otp twilio-verify-otp
  vcard-chat vcard-og-image verify-custom-domain weekly-digest
)

NO_JWT=(send-notification send-appointment-notification send-contact-notification
        generate-vcard-bio vcard-og-image vcard-chat)

export SUPABASE_ACCESS_TOKEN="$TARGET_ACCESS_TOKEN"

for fn in "${FUNCTIONS[@]}"; do
  echo "==> Deploying: $fn"
  extra=""
  if [[ " ${NO_JWT[*]} " =~ " ${fn} " ]]; then
    extra="--no-verify-jwt"
  fi
  supabase functions deploy "$fn" --project-ref "$TARGET_PROJECT_REF" $extra || {
    echo "    ⚠️  $fn deploy ব্যর্থ — এড়িয়ে যাচ্ছি"
  }
done

echo ""
echo "==> ✅ Functions deploy সম্পন্ন।"
echo "==> Studio → Edge Functions → Secrets-এ এই secrets সেট করুন:"
echo "    RESEND_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT"
echo "    TWILIO_API_KEY, TWILIO_VERIFY_SERVICE_SID"
echo "    LOVABLE_API_KEY (⚠️ self-host-এ কাজ করবে না — AI functions rewrite দরকার)"
