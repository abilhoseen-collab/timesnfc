# Self-Hosted Supabase Migration Toolkit

Target: `https://app.timescard.cloud` (VPS) থেকে run করার জন্য।

## ধাপ অনুযায়ী চালানো

```bash
# 1. VPS-এ Supabase install
bash 01-install-supabase.sh

# 2. Env & secrets configure
cp .env.example .env   # তারপর edit করুন
# JWT_SECRET, POSTGRES_PASSWORD, ANON_KEY, SERVICE_ROLE_KEY, SMTP_* fill করুন

# 3. Schema + RLS + functions + triggers migrate
export TARGET_DB_URL="postgresql://postgres:PASS@localhost:5432/postgres"
bash 02-apply-migrations.sh

# 4. Source (Lovable Cloud) থেকে data + auth dump
#    Lovable Cloud-এর DB URL support-এর কাছ থেকে নিতে হবে
export SOURCE_DB_URL="postgresql://..."
bash 03-dump-source.sh   # /tmp/migration-dumps/ এ dump ফেলবে

# 5. Target-এ data restore
bash 04-restore-data.sh

# 6. Storage buckets + files copy
export SOURCE_SUPABASE_URL="https://minylqvqwrawlzrjgazm.supabase.co"
export SOURCE_SERVICE_KEY="..."
export TARGET_SUPABASE_URL="https://api.timescard.cloud"
export TARGET_SERVICE_KEY="..."
bash 05-migrate-storage.sh

# 7. Edge functions deploy
bash 06-deploy-functions.sh

# 8. Cron jobs setup
psql "$TARGET_DB_URL" -f 07-cron-jobs.sql

# 9. Smoke test
bash 08-smoke-test.sh
```

## ⚠️ গুরুত্বপূর্ণ

- **Source DB URL**: Lovable Cloud managed — direct psql access নেই। Lovable support-এর কাছে data export request করতে হবে (Cloud → Advanced settings → Export data)।
- **LOVABLE_API_KEY**: Self-host-এ কাজ করবে না। `enhance-image`, `generate-vcard-bio`, `vcard-chat` — এই ৩টি function-এ OpenAI/Gemini direct key ব্যবহার করতে edit করতে হবে (Phase 6 alternative)।
- **Frontend `.env`**: Migration সফল হওয়ার পর Lovable-এ `.env` update — এটি Lovable Cloud এখন managed, তাই Lovable support-এর সাথে "External Supabase mode" enable করাতে হবে।
