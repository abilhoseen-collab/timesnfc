# Self-Hosted Supabase-এ Migration Plan

**Target**: `https://app.timescard.cloud` (আপনার VPS)  
**Source**: Lovable Cloud managed Supabase
**Frontend**: Lovable-এ থাকবে (শুধু `.env` update হবে)

---

## Phase 0 — Prerequisites (আপনি করবেন)

আপনার VPS-এ এগুলো প্রস্তুত থাকতে হবে:

1. **Server specs**: 4 CPU / 8 GB RAM / 100 GB SSD (minimum), Ubuntu 22.04+
2. **DNS records** পয়েন্ট করবেন VPS IP-তে:
  - `app.timescard.cloud` → Supabase Studio
  - `api.timescard.cloud` (বা `dashboard.timescard.cloud/rest`) → Kong API gateway
3. **Ports open**: 80, 443, 5432 (DB), 8000 (Kong)
4. **SSL certificate**: Let's Encrypt (Nginx/Caddy দিয়ে)
5. **SMTP** credentials (auth email-এর জন্য — Resend/Postmark/Gmail)

---

## Phase 1 — Self-Hosted Supabase Install

Official docker-compose দিয়ে install:

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# .env-এ সেট করুন:
#   POSTGRES_PASSWORD, JWT_SECRET (min 32 char), ANON_KEY, SERVICE_ROLE_KEY
#   SITE_URL=https://app.timescard.cloud
#   API_EXTERNAL_URL=https://api.timescard.cloud
#   SMTP_* fields
#   DASHBOARD_USERNAME/PASSWORD
docker compose up -d
```

Verify: Studio (`:3000`), REST (`:8000/rest/v1`), Auth (`:8000/auth/v1`), Storage (`:8000/storage/v1`) — সব up।

Nginx/Caddy reverse proxy দিয়ে HTTPS + subdomain routing।

---

## Phase 2 — Schema + RLS Migration

`supabase/migrations/` ফোল্ডারে ৫০+ migration file আছে (2025-12-27 থেকে 2026-07-23 পর্যন্ত)।

```bash
# VPS থেকে (Supabase CLI দিয়ে)
supabase link --project-ref <target> --db-url "postgresql://postgres:PASS@localhost:5432/postgres"
supabase db push
```

অথবা directly psql দিয়ে file-গুলো order-ধরে run করা:

```bash
for f in supabase/migrations/*.sql; do
  psql "$TARGET_DB_URL" -f "$f"
done
```

এতে সব table (৩৯টি), function (১২+), trigger, RLS policy, GRANT migrate হবে।

**Verify**: `\dt public.*` দিয়ে সব table check + linter run।

---

## Phase 3 — Data Migration (rows + auth users)

### 3a. Auth users

```bash
# Source থেকে dump
pg_dump "$SOURCE_DB_URL" \
  --data-only \
  --schema=auth \
  -t auth.users -t auth.identities -t auth.mfa_factors \
  --column-inserts > auth_data.sql

# Target-এ restore (auth schema পরে)
psql "$TARGET_DB_URL" -f auth_data.sql
```

এতে password hash সহ সব user, তাদের existing password দিয়ে login করতে পারবে।

### 3b. Public schema rows

```bash
pg_dump "$SOURCE_DB_URL" \
  --data-only --schema=public \
  --disable-triggers \
  --column-inserts > public_data.sql
psql "$TARGET_DB_URL" -f public_data.sql
```

Order matters: parent table (profiles, teams) আগে, child (vcards, leads) পরে — pg_dump নিজেই handle করে।

---

## Phase 4 — Storage Buckets + Files

৪টি bucket migrate করতে হবে:

- `profile-photos` (public)
- `qr-logos` (public)
- `landing-page-assets` (public)
- `payment-screenshots` (private)

```bash
# Bucket rows create (target Studio-এ manually অথবা SQL)
# তারপর files copy — S3/rclone দিয়ে:
supabase storage cp --recursive \
  "sb://<source>/profile-photos" \
  "sb://<target>/profile-photos"
```

অথবা source storage API দিয়ে download → target-এ upload script।

---

## Phase 5 — Edge Functions Deploy

২১টি function `supabase/functions/`-এ আছে। VPS-এ:

```bash
supabase functions deploy --project-ref <target> \
  --no-verify-jwt appointment-reminders create-user-account \
  delete-user-account dispatch-integrations enhance-image \
  generate-invoice generate-vcard-bio lead-followup-reminders \
  send-appointment-notification send-contact-notification \
  send-notification send-payment-notification send-team-invitation \
  send-web-push subscription-expiry-notification twilio-send-otp \
  twilio-verify-otp vcard-chat vcard-og-image verify-custom-domain \
  weekly-digest
```

`supabase/config.toml`-এর `verify_jwt` settings honor হবে।

---

## Phase 6 — Secrets Configuration

Target Supabase-এ এই secrets সেট করুন (Studio → Edge Functions → Secrets):


| Secret                                                           | উৎস                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Self-host `.env`                                                               |
| `SUPABASE_DB_URL`                                                | `postgresql://postgres:PASS@db:5432/postgres`                                  |
| `RESEND_API_KEY`                                                 | আপনার Resend account                                                           |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`         | Web Push (আগের বার্তায় explain করা)                                           |
| `LOVABLE_API_KEY`                                                | ⚠️ Self-hosted-এ কাজ করবে না — OpenAI/Gemini direct key দিয়ে replace করতে হবে |


**গুরুত্বপূর্ণ**: `enhance-image`, `generate-vcard-bio`, `vcard-chat` edge functions Lovable AI Gateway ব্যবহার করে। Self-host-এ এগুলো OpenAI/Google Gemini direct API-তে rewrite করতে হবে (আলাদা phase)।

---

## Phase 7 — Frontend Reconnect (Lovable-এ)

Lovable-এ থাকা frontend শুধু নতুন backend-এ point করবে:

`.env` update:

```
VITE_SUPABASE_URL=https://api.timescard.cloud
VITE_PLUTO_PUBLISHABLE_KEY=pluto_pk_tfWPBHQXNrP5gvYpN1ZIzC4ChQ7ecqaMlYHfnrF7BZU
VITE_SUPABASE_PROJECT_ID= timesn05
```

⚠️ **Note**: বর্তমানে Lovable Cloud enabled — এটি managed। নিজের Supabase-এ যেতে হলে Lovable Cloud disable করে "External Supabase" connect করতে হবে, অথবা `.env` manually override করলে auto-regenerated `client.ts` conflict করবে। Lovable support-এর সাথে কথা বলে external connection mode enable করাতে হবে।

`src/integrations/supabase/types.ts` auto-generated — target DB থেকে regenerate:

```bash
supabase gen types typescript --db-url "$TARGET_DB_URL" > src/integrations/supabase/types.ts
```

---

## Phase 8 — Auth Config

Self-hosted Studio → Authentication → Providers:

- Email/password enable
- Google OAuth (আপনার Google Cloud Console credentials)
- Redirect URLs: `https://dashboard.timescard.cloud/**`, `http://localhost:8080/**`
- Email templates (Bengali) copy করুন

`auth.config` — signup enable/disable, JWT expiry (default 3600s ok)।

---

## Phase 9 — Cron Jobs (pg_cron)

Weekly digest, appointment reminders, subscription expiry — এগুলো cron-based। Self-hosted-এ `pg_cron` extension enable করে schedule করতে হবে:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('weekly-digest', '0 9 * * 1', $$
  SELECT net.http_post('https://api.timescard.cloud/functions/v1/weekly-digest', ...);
$$);
```

---

## Phase 10 — Testing + Cutover

1. **Smoke test** (target-এ): login, vCard create, lead submit, payment, notification
2. **DNS cutover**: `.env` update → Lovable frontend redeploy
3. **Monitoring**: Postgres logs, edge function logs, disk usage
4. **Backup schedule**: `pg_dump` daily + storage rsync

---

## Technical Details

**Risk points**:

- Auth user migration-এ password hash format একই (bcrypt) — ✅ compatible
- `LOVABLE_API_KEY`-এর ৩টি AI function rewrite দরকার
- Lovable Cloud disconnect করা যায় না বর্তমান project থেকে (memory-তে documented) — external Supabase mode-এ switch করার জন্য Lovable support প্রয়োজন
- pg_cron self-hosted-এ manual setup
- Storage public URL format বদলাবে — DB-তে stored full URL থাকলে update দরকার

**Rollback**: DNS/`.env` পুরোনো Lovable Cloud values-এ ফিরিয়ে আনলেই source active।

**Estimated time**: Install 2h + Schema/Data 2h + Storage 1-3h (size dependent) + Functions 1h + Testing 3h = **1 কর্মদিবস**।

---

## আপনার পরবর্তী action

1. VPS-এ Phase 0 prerequisites confirm করুন (RAM, DNS, SMTP)
2. আমাকে জানান কোন phase দিয়ে শুরু করব — সম্ভবত **Phase 1 install script + Phase 2 migration bundle** তৈরি দিয়ে শুরু
3. Source DB access (Lovable Cloud) থেকে dump নেওয়ার জন্য আমি `pg_dump` script prepare করে দেব

Approve করলে Phase 1 এর install script + Phase 2 এর consolidated migration file তৈরি করে দেব।