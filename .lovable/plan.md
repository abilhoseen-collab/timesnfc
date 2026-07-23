## Full Frontend Sweep — Audit + Hardening

Scope: 40+ pages, 100+ components. Goal: consistent error handling, input validation, loading/empty states, a11y, performance, and Bengali UX polish across the app.

### Batch A — Auth & Onboarding (5 pages)
Files: `Auth.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `AcceptInvite.tsx`, `TwoFactorAuth.tsx`
- Zod schemas for all form inputs (email/password/phone).
- Bengali `getUserFriendlyError` on every catch; toast + inline field errors.
- Loading skeletons and disabled states while submitting.
- Prevent duplicate submits; keyboard/enter handling.
- Redirect-preservation via query param, not localStorage.

### Batch B — vCard Editor & Public View
Files: `VCardEditor.tsx`, `src/components/vcard-editor/**`, `VCardPublic.tsx`, `src/components/vcard/**`
- Add `ErrorBoundary` around each editor tab so a single tab crash won't blank the page.
- Debounced saves already exist — surface save status (saving/saved/error) with retry.
- Validate URLs, phone, email per section before save.
- Public view: 404 empty state, share fallback, image lazy-load, srcset for `photos`.
- A11y: form labels, focus rings, `aria-live` for save status.

### Batch C — Dashboard, Leads, Orders, Billing
Files: `Dashboard.tsx`, `Leads.tsx`, `Orders.tsx`, `Billing.tsx`, `TrackOrder.tsx`, `Cart.tsx`, `Payment.tsx`, `NFCPayment.tsx`
- Standard `EmptyState` component + skeleton loaders per list.
- Pagination / virtualized lists on Leads and Orders when >50 rows.
- Consistent currency/date formatters (Bengali locale).
- Payment forms: file upload size/type validation, screenshot preview, error retry.

### Batch D — Admin Panel
Files: `Admin.tsx`, `src/components/admin/**`
- Guard every mutation with confirm dialogs.
- Zod validation on package/CMS forms.
- Audit logs surfaced (view-only) where available.

### Batch E — Growth pages
Files: `Directory.tsx`, `Network.tsx`, `Referrals.tsx`, `AffiliateDashboard.tsx`, `Leaderboard.tsx`, `LinktreeView.tsx`, `HelpCenter.tsx`, `LandingPageBuilder.tsx`, `LandingPagePublic.tsx`, `BulkCreate.tsx`, `BulkQR.tsx`, `Teams.tsx`, `Support.tsx`
- Search debouncing, empty/error states, share fallbacks.
- Landing builder: guard destructive reorder/delete with undo toast.
- Teams: role-gated UI; hide actions the user can't perform.

### Batch F — Shared infra
- New `src/components/common/EmptyState.tsx`, `LoadingState.tsx`, `AsyncBoundary.tsx` wrapping `ErrorBoundary` + `Suspense`.
- `src/lib/formatters.ts` (bnDate, bnCurrency, bnNumber).
- Extend `getUserFriendlyError` mapping table for network/timeout/offline.
- Global `useMutation` defaults with toast on error.
- Verify all `<img>` have `alt` and `loading="lazy"` except LCP.
- Route-level code splitting audit (`React.lazy` for heavy routes only).

### Verification
- Build passes.
- `tsgo` clean.
- Playwright smoke: `/`, `/auth`, `/dashboard`, `/leads`, `/orders`, `/vcard-editor/:id`, `/vcard/:slug`, `/admin`, `/directory` — capture screenshots, check console for errors.

### Order of execution
F (infra) → A → B → C → D → E → verification pass. Batches shipped sequentially in one turn each so you can review incrementally.

Confirm and I'll start with Batch F + A.