# Phase 7 — Full Offline PWA ✅

## যা যোগ হয়েছে

### 🔌 Service Worker (vite-plugin-pwa)
- `generateSW` + `autoUpdate`; SW path: `/sw.js`.
- **NetworkFirst** for HTML navigations (4s timeout → cache fallback)।
- **CacheFirst** for hashed JS/CSS/fonts + images + Google Fonts।
- `/~oauth`, `/api`, `/functions` excluded from nav fallback।
- Old caches auto-cleaned, clients claim on activate।

### 🛡️ Guarded registration
- `src/pwa/registerSW.ts` — শুধু production + real published origin-এ register করে।
- Dev / Lovable preview / iframe / `?sw=off` → stale workers unregister।
- `injectRegister: null` + `devOptions.enabled: false` — auto-inject নেই।

### 📲 Install prompt
- `beforeinstallprompt` ক্যাপচার + custom Bengali install banner।
- "পরে" করলে ৭ দিন hidden।
- `appinstalled` event-এ auto-dismiss।

### 🔄 Update flow
- নতুন SW waiting হলে toast: "নতুন ভার্সন প্রস্তুত — আপডেট" বোতাম।
- ক্লিকে `SKIP_WAITING` → `controlling` event → auto reload।

### 📴 Offline UX
- `window.online/offline` listener → top banner: "আপনি অফলাইনে — ক্যাশ থেকে দেখানো হচ্ছে"।
- `/offline` fallback page (manual navigation; nav fallback সাধারণত cached index.html serve করে)।

## Files
- new: `src/pwa/registerSW.ts`
- new: `src/components/PWAManager.tsx`
- new: `src/pages/Offline.tsx`
- edited: `vite.config.ts`, `src/App.tsx`
- added dev deps: `vite-plugin-pwa`, `workbox-window`

## Preview note
SW Lovable preview-এ disable করা — শুধু **published** app-এ কাজ করবে।
Publish-এর পর Chrome DevTools → Application → Service Workers-এ দেখা যাবে।

## Phase 8 candidates
- True PNG OG image (resvg-wasm)
- Mobile app wrapper (Capacitor)
- Push notifications (FCM)
- Advanced i18n: form labels, error messages, full coverage
