## Phase 9 — পাঁচটি বড় ফিচারের রোডম্যাপ

আপনি একসাথে ৫টি বড় ফিচার চেয়েছেন। প্রতিটি নিজেই ১টি phase-এর কাজ। একসাথে সব করলে bug ও regression-এর ঝুঁকি অনেক বেশি — তাই আমি **৫টি sub-phase-এ ভাগ করে** ধারাবাহিকভাবে ship করার প্রস্তাব দিচ্ছি। প্রতিটি phase শেষে আপনি test করতে পারবেন, তারপর পরেরটায় যাব।

---

### সুপারিশকৃত ক্রম (risk + dependency বিবেচনা করে)

```text
Phase 9.1  ▸  Image optimization pipeline       ⚡ সহজ, সবার উপকার, কোনো breaking change নেই
Phase 9.2  ▸  Lead capture → CRM + notifications 📥 ছোট, existing leads table extend
Phase 9.3  ▸  Bulk CSV vCard generator           📊 মাঝারি, isolated UI flow
Phase 9.4  ▸  Web Push (FCM) + Weekly digest     🔔 মাঝারি, FCM সেটআপ + cron
Phase 9.5  ▸  Team / multi-user + RBAC           👥 সবচেয়ে বড়, schema-wide impact — শেষে
```

---

### Phase 9.1 — Image Optimization Pipeline

**লক্ষ্য:** আপলোড-করা সব ছবি auto-resize + WebP convert হবে।

- নতুন edge function `optimize-image` — Sharp/ImageMagick এর পরিবর্তে Deno-compatible `@jsr:imagemagick/magick-wasm` বা `npm:@cf-wasm/photon` ব্যবহার (Deno edge runtime-এ চলে)।
- Input: original file → Output: ৩টি size (thumb 200, medium 800, large 1600) WebP format-এ।
- `PhotoUploader.tsx`, vCard photo, landing page assets — সব uploader এই pipeline-এ যাবে।
- Original file Storage-এ রাখা হবে না, শুধু optimized variants।
- Backward-compat: পুরনো PNG/JPG URL কাজ করতেই থাকবে।

**Expected gain:** Image bandwidth ~৭০% কমবে, vCard load ৩× দ্রুত।

---

### Phase 9.2 — Lead Capture → CRM + Notifications

**লক্ষ্য:** vCard-এর contact form, booking, NFC tap — সব lead `vcard_leads`-এ auto-save + owner notify।

- `vcard_leads` এ নতুন column: `tags TEXT[]`, `status` (new/contacted/won/lost), `notes`, `assigned_to`।
- ফর্ম submit হলেই edge function trigger → row insert + email (Resend already configured) + in-app `notifications` row।
- Lead inbox UI: filter by tag/status, bulk tag, CSV export (existing pattern)।
- Per-lead detail drawer with timeline (visit → form → contact)।

---

### Phase 9.3 — Bulk CSV vCard Generator

**লক্ষ্য:** HR/admin একটি CSV upload করলেই ৫০-২০০ vCard auto-create।

- `/bulk-create` page (already `/bulk-qr` আছে — সেটার পাশে)।
- CSV template download button (column header pre-filled)।
- Parser: `papaparse` (lightweight, already-vibe library)।
- Preview table with validation errors per row।
- Background batch insert via edge function — chunk of 25, progress bar।
- Output: success report + downloadable CSV with generated slug/URL/QR for each।
- Subscription quota check — Business tier-এ unlock।

---

### Phase 9.4 — Web Push (FCM) + Weekly Digest

**লক্ষ্য:** Custom event-এ push + প্রতি রবিবার weekly analytics email।

- **FCM setup:** Firebase project তৈরি করতে হবে আপনাকে (আমি step-by-step গাইড দেব), তারপর সাতটি secret save করব: `FCM_SERVER_KEY`, `VITE_FCM_*` (publishable VAPID/config)।
- `firebase-messaging-sw.js` শুধু পুশের জন্য (app-shell SW থেকে আলাদা)।
- `push_subscriptions` table — per user device tokens।
- Edge function `send-push` — admin trigger / event-based।
- **Weekly digest:** pg_cron প্রতি রবিবার সকাল ৯টা (BDT) → `weekly-digest` edge function → প্রতি user-এর last-7-days analytics (visits, leads, top vCard) → Resend দিয়ে branded HTML email।

---

### Phase 9.5 — Team / Multi-User Accounts + RBAC

**লক্ষ্য:** এক subscription-এ একাধিক team member, role-based access।

- নতুন tables: `teams`, `team_members (team_id, user_id, role: owner|admin|editor|viewer)`, `team_invitations (email, token, expires_at)`।
- `vcards`, `landing_pages`, `vcard_leads` — সব ownership table-এ optional `team_id` যোগ।
- Updated RLS: existing user-level + team-level via `is_team_member(team_id, role)` security-definer function।
- Invitation flow: owner invites email → Resend → recipient signs up/logs in → joins team।
- Team switcher UI (header dropdown)।
- Subscription/quota — team-level হবে (owner's package সবাই use করবে)।
- Migration: existing user-এর সব data তার নিজের default team-এ migrate হবে (zero-downtime)।

⚠️ এই phase-টিতে অনেক RLS policy rewrite করতে হবে — তাই **সবার শেষে**, যাতে আগের phase-গুলো stable থাকে।

---

### Technical highlights (যেগুলো user-জনিত কনফার্মেশন লাগবে না)

- সব edge function `verify_jwt` validation করবে।
- সব নতুন table-এ proper GRANT + RLS।
- Push subscription token — RLS দিয়ে শুধু owner দেখতে পারবে (privacy)।
- CSV upload — server-side validation (zod), max 500 rows, file size 5MB।
- Image optimizer — output cached via existing Workbox `vcard-assets` runtime cache (already Phase 8-এ যোগ করেছি)।

---

### আপনার সিদ্ধান্ত দরকার

1. **ক্রম ঠিক আছে?** নাকি অন্য কোনোটা আগে চান (যেমন Team আগে)?
2. **Phase 9.4 FCM**-এর জন্য Firebase account-এর access আপনার আছে?
3. **এক phase-এ এক approval** নাকি **৯.১ + ৯.২ একসাথে** (দুটোই ছোট ও isolated) শুরু করব?

আপনি OK বললেই **Phase 9.1 (Image Optimization)** দিয়ে শুরু করব।