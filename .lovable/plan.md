# Phase 5 — Business Bundle ✅

## যা যোগ হয়েছে

### 🧲 CRM Lead Manager (`/leads`)
- নতুন `vcard_leads` টেবিল — সব visitor inquiry এক জায়গায়।
- Source: contact_form / chat / appointment / manual। Status: new → contacted → qualified → converted / lost।
- Owner CSV export, status pipeline view (5-column stats), search, status filter, per-lead notes ডায়ালগ।
- ContactForm স্বয়ংক্রিয়ভাবে lead capture করে।
- RLS: owner/admin শুধুমাত্র; পাবলিক visitor কেবল contact_form/chat/appointment source দিয়ে insert করতে পারে।

### 📦 Bulk QR (`/bulk-qr`)
- ইউজারের সব সক্রিয় vCard থেকে একসাথে QR জেনারেট।
- কাস্টম সাইজ, color, background।
- ZIP ডাউনলোড + manifest.csv।
- Individual download অপশনও আছে।

### 🛠️ Maintenance Mode
- `MaintenanceGate` wrapper সব রুটে। `site_settings.maintenance_mode = { enabled, message, eta }`।
- Admin সবসময় bypass করে। `/auth`, `/admin`, legal pages সবসময় খোলা থাকে।
- Admin panel-এ নতুন "Maintenance" ট্যাব।
- সুন্দর Bengali maintenance পেজ।

### 🔐 2FA (TOTP)
- AccountSettings → নতুন "2FA" ট্যাব।
- Supabase MFA enroll/challenge/verify ফ্লো।
- QR + manual secret কপি; ৬-ডিজিট কোড দিয়ে চালু/বন্ধ।
- Google Authenticator, Authy ইত্যাদি সাপোর্টেড।

### 🚦 Navigation
- Dashboard header-এ Leads (Users) + Bulk QR (QrCode) আইকন যোগ।

## Files
- new: `src/hooks/useMaintenanceMode.tsx`
- new: `src/components/MaintenanceGate.tsx`
- new: `src/components/TwoFactorAuth.tsx`
- new: `src/components/admin/MaintenanceSettings.tsx`
- new: `src/pages/Maintenance.tsx`, `Leads.tsx`, `BulkQR.tsx`
- edited: `App.tsx`, `Admin.tsx`, `AccountSettings.tsx`, `Dashboard.tsx`, `ContactForm.tsx`
- migration: `vcard_leads` table + RLS + indexes

## Phase 6 candidates
- i18n English toggle
- AI image enhancement
- Geo-map analytics
- Full offline PWA (service worker)
- True PNG OG image (resvg-wasm)
- Mobile app wrapper (Capacitor)
