# Locale Fallback — Research Document

**Date:** 2026-03-16

---

## Goal

When a user visits the website and gets geo-redirected to a locale that is not enabled in the CMS (e.g., `/lt`), gracefully fall back to `/en` instead of entering an infinite redirect loop.

## Key Objectives

1. Break the infinite redirect loop between middleware geo-detection and layout `enabledLocales` check
2. Ensure users from unsupported-locale countries see English content
3. Preserve existing geo-detection for actually enabled locales
4. Keep the `NEXT_LOCALE` cookie mechanism working for the locale selector

## How It Works Now

### Current Flow (Broken)

1. User visits `/` from Lithuania
2. **Middleware** (`src/middleware.ts`):
   - No `NEXT_LOCALE` cookie → checks geo headers
   - `x-vercel-ip-country: LT` → `country = 'lt'` → `countryToLocale['lt'] = 'lt'`
   - Checks `localeCodes.includes('lt')` → ✓ (static list of ALL defined locales)
   - Sets `NEXT_LOCALE=lt` on the request object
3. **next-intl middleware**: sees `NEXT_LOCALE=lt` → redirects to `/lt` → sets `NEXT_LOCALE=lt` cookie on response
4. Browser now has `NEXT_LOCALE=lt` cookie, follows redirect to `/lt`
5. **Layout** (`src/app/(frontend)/[locale]/layout.tsx`):
   - Fetches `enabledLocales` from CMS (dynamic subset)
   - `lt` NOT in `enabledLocales` → `redirect('/')`
6. Browser goes to `/` WITH `NEXT_LOCALE=lt` cookie
7. **Middleware**: cookie exists → skips geo detection → `intlMiddleware` sees cookie `lt` → redirects to `/lt`
8. **LOOP** → steps 5-7 repeat forever → browser shows "too many redirects" error

### Root Cause

**Mismatch between two locale lists:**
- `localeCodes` (static, in `src/i18n/locales.ts`) — all 8 defined locales
- `enabledLocales` (dynamic, from CMS `site-settings`) — subset actually enabled

The middleware validates against `localeCodes`, the layout validates against `enabledLocales`. When a locale is defined but not enabled, the redirect loop occurs.

## Current Infrastructure & Flow

- **Middleware**: Edge function, no access to Payload/MongoDB
- **Layout**: Server Component, has access to Payload (can query `enabledLocales`)
- **Cookie**: `NEXT_LOCALE` — set by next-intl on response, read by middleware on next request
- **Routing**: `localePrefix: 'as-needed'` — default locale (`en`) has no prefix, others get `/lt`, `/lv`, etc.

## To-Do List

1. Add fallback query parameter handling in middleware to break redirect loops
2. Update layout redirect to signal fallback intent via query parameter
3. Ensure `NEXT_LOCALE` cookie is reset to default locale on fallback

## Implementation Strategy

**Two-file fix using a `__fallback` query parameter to break the loop:**

### Change 1: `src/middleware.ts`

At the top of the middleware function, detect `?__fallback=1`:
- Override `NEXT_LOCALE` cookie to `defaultLocale` (`en`) on both request and response
- Strip `__fallback` param from URL
- Redirect to clean `/` URL with the corrected cookie

### Change 2: `src/app/(frontend)/[locale]/layout.tsx`

Change `redirect('/')` to `redirect('/?__fallback=1')` when locale is not in `enabledLocales`.

### Fixed Flow

1. User visits `/` from Lithuania
2. Middleware: geo detects `lt` → sets cookie → next-intl redirects to `/lt`
3. Layout: `lt` not in `enabledLocales` → `redirect('/?__fallback=1')`
4. Middleware: sees `__fallback=1` → overrides cookie to `en` → redirects to clean `/`
5. Middleware: cookie is now `en` → `en` is default → next-intl serves `/` → page loads ✓

## Technical Stack

- Next.js 15 middleware (edge runtime)
- next-intl `createMiddleware`
- `NextResponse` for cookie manipulation
- Payload CMS `site-settings` global (for `enabledLocales`)

## Simplified Data Flow

```
User visits / ──► Middleware (geo → lt) ──► /lt
                                              │
                              lt not enabled? ──► /?__fallback=1
                                                      │
                              Middleware (reset → en) ──► / (clean, en content)
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Query param visible in URL briefly | Middleware strips it and issues a clean redirect before the page renders |
| Extra redirect hop | Only happens once per session — cookie is corrected, subsequent visits go straight to `/` |
| User manually visits disabled locale | Same fallback mechanism kicks in — one extra redirect, then English |
| Enabled locales change in CMS | No middleware restart needed — layout always checks live CMS data |
