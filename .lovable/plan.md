# Phase 8 — True PNG OG + Capacitor Mobile App ✅

## A. True PNG Open Graph Image
- `vcard-og-image` edge function এখন **@resvg/resvg-wasm** দিয়ে SVG → 1200×630 PNG render করে।
- Profile photo base64-embedded; gradient bg, accent circles, name/job/company text।
- Default: PNG; `?format=svg` দিলে SVG (debug/preview)।
- Cache: 24h public + s-maxage।
- Facebook/WhatsApp/LinkedIn/Slack — সবাই এখন real PNG দেখবে (SVG support ছিল না অনেক জায়গায়)।

## B. Capacitor Mobile App (Android/iOS)
### Installed
- `@capacitor/core`, `@capacitor/cli` (dev)
- `@capacitor/ios`, `@capacitor/android`
- Native plugins: `share`, `push-notifications`, `app`, `haptics`, `status-bar`

### Files
- `capacitor.config.ts` — appId `app.lovable.26abe0ec...`, hot-reload server URL set।
- `src/lib/native.ts` — wrapper: `nativeShare`, `hapticTap`, `registerPush`, `initNativeShell`।
- `src/main.tsx` → `initNativeShell()` (StatusBar dark + Android back-button)।
- `ShareDialog.tsx` → native share menu প্রথমে চেষ্টা করে, fallback web Share API।

### User-side setup (Lovable preview-এ run করবে না)
1. **Export to Github** → git pull।
2. `npm install`
3. `npx cap add android` ও/বা `npx cap add ios`
4. `npx cap update android` / `npx cap update ios`
5. `npm run build`
6. `npx cap sync`
7. `npx cap run android` (Android Studio দরকার) বা `npx cap run ios` (Mac + Xcode দরকার)

### হটরিলোড
Capacitor app সরাসরি Lovable sandbox preview URL load করবে — তাই **প্রতি edit-এ rebuild ছাড়াই** dev iteration সম্ভব।

📖 ব্লগ: https://lovable.dev/blog/2025-02-06-lovable-mobile-apps-with-capacitor

## Phase 9 candidates
- FCM push notification full pipeline (edge function → device)
- Advanced i18n (form labels, error messages full coverage)
- App Store/Play Store metadata + screenshots automation
