# Consolidated Schema Bundle

`schema-bundle.sql` — সব ৪২টি migration file একটি single, transaction-wrapped SQL bundle-এ merge করা।

## কী আছে

- `BEGIN; ... COMMIT;` — সব-বা-কিছুই-না semantics। কোনো statement fail করলে সম্পূর্ণ rollback।
- Prereq extensions (`uuid-ossp`, `pgcrypto`, `pg_cron`, `pg_net`) auto-enable।
- সব ৪২ migration timestamp-order-এ concatenated, header comment সহ (কোন file, কোন block)।

## চালানোর নিয়ম (self-hosted VPS)

```bash
export TARGET_DB_URL="postgresql://postgres:PASS@localhost:5432/postgres"
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f schema-bundle.sql
```

## `02-apply-migrations.sh` এর সাথে পার্থক্য

| দিক               | `02-apply-migrations.sh`               | `schema-bundle.sql`                  |
| ----------------- | -------------------------------------- | ------------------------------------ |
| Execution         | File-ধরে ৪২ বার psql call              | ১ transaction, ১ call                |
| Failure isolation | যেই file-এ fail সেখানেই থামে (partial) | Fail হলে পুরো rollback (clean state) |
| Debug             | Per-file log                           | psql error line → bundle-এর header   |
| Idempotency       | Individual file rerun সম্ভব            | পুরো bundle rerun (কিছু stmt duplicate error দিতে পারে) |

**Recommendation**: প্রথমবার clean install-এ `schema-bundle.sql` — atomic, নিরাপদ।

## Regenerate

Migration পরিবর্তন হলে bundle rebuild:

```bash
# repo root থেকে
bash scripts/self-host-migration/build-bundle.sh
```
