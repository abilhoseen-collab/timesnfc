# Phase 3 — আংশিক সম্পন্ন

## ✅ যা যোগ হয়েছে
- **#১৭ AI Features**: `generate-vcard-bio` এজ ফাংশন (Lovable AI Gateway, gemini-3-flash-preview)। `BasicInfoEditor`-এ "AI দিয়ে লিখুন" বোতাম — কীওয়ার্ড + টোন (পেশাদার/বন্ধুত্বপূর্ণ/সৃজনশীল) + ভাষা (বাংলা/English) অপশন।
- **#৯ Advanced Analytics**: `AdvancedAnalytics.tsx` — ডিভাইস (মোবাইল/ট্যাবলেট/ডেস্কটপ), ব্রাউজার, ট্রাফিক সোর্স/রেফারার, দেশ, কনভার্সন ফানেল (view → unique → click) + কনভার্সন রেট। `VCardAnalyticsDashboard`-এ ইন্টিগ্রেট।

## ⏳ বাকি (Phase 3)
- **#১৩ i18n**: পাবলিক vCard-এ English টগল — পুরো সাইটে wide-ranging refactor, পরবর্তী সেশনে নেওয়া যেতে পারে।
- **AI চ্যাটবট** ভিজিটরদের জন্য — vCard-এ embed (`ChatWidgetSettings`-এর সাথে integration)।
- **AI ইমেজ এনহান্সমেন্ট** প্রোফাইল ছবির জন্য।
- জিও-ম্যাপ ভিজ্যুয়াল (currently bar/list; map view requires `country` codes এবং extra library)।
- CSV/PDF এক্সপোর্ট for advanced analytics (existing `AnalyticsExport` already covers basics)।

## পরে (optional polish)
- ১২ PWA, ১৪ Social sharing + OG image auto-gen, ১৫ CRM lead manager, ১৬ Bulk QR, ১৮ Maintenance mode, ১৯ 2FA, ২০ Mobile app wrapper।
