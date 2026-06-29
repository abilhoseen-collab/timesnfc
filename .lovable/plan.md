# Phase 4 — Engagement Bundle ✅

## যা যোগ হয়েছে
- **AI চ্যাটবট (visitor)**: `vcard-chat` edge function (Lovable AI Gateway, streaming Gemini 3 Flash) + `VCardChatWidget` floating bubble in public vCard। vCard owner-এর bio/contact context system prompt-এ inject হয়; বাংলা/ইংরেজি auto-detect। `chat_enabled` true হলে শো হয়।
- **Social Sharing**: `ShareDialog` — WhatsApp, Facebook, Twitter/X, LinkedIn, Telegram, Email + copy link + native share fallback। OG image preview built-in।
- **OG Image auto-gen**: `vcard-og-image` edge function — dynamic 1200×630 SVG with photo, name, title, company। Cached 1h।
- **Per-vCard meta (Helmet)**: title, description, canonical, og:*, twitter:* tags route-level।
- **PWA (manifest-only)**: `manifest.webmanifest` + icons (192/512/apple-touch) + theme-color + apple-mobile meta — Add to Home Screen ready।

## Known limitations
- OG image is SVG — LinkedIn/Twitter render it; Facebook/iMessage may fall back to default। (Future: PNG rasterization via resvg-wasm)।
- Per-vCard meta tags via Helmet work for JS-executing crawlers (Google, Slack, Twitter)। Pure non-JS crawlers see static `index.html` fallback।
- Manifest-only PWA — offline support and service worker postponed (per default PWA guidance)।

## Phase 3 যা এখনো বাকি (Optional, Phase 5+)
- i18n (English toggle, পুরো site)
- AI image enhancement
- Geo-map visualization
- CSV/PDF advanced analytics export

## Phase 5 candidates
- CRM Lead Manager, Bulk QR, 2FA, Maintenance Mode (Business Bundle)
- Offline PWA (full service worker)
- True PNG OG image (resvg-wasm)
