# Localized content editing — CMS-editable nav + read-only locale banner + per-locale social links

Source: Jarūnė Preikšaitė email 2026-06-29 ("aitraininghub.eu - bugs"), tickets WGT-51 (menu text), WGT-52 (Site Settings / social media), and the CTA-editing report.

## Context

Related complaints from country/content admins, all "I can't edit this", but **three distinct root causes**:

1. **CTA text** — _not actually broken._ CTA fields (`newsletter.ctaText`, `landing-page.hero.ctaText`, `site-settings.headerCtaText`) are all `localized: true` and editable. The block is the by-design locale gate `globalLocaleRestrictedUpdate` (`src/lib/access.ts`): a country-admin can only edit a global when the **selected admin locale ∈ their assignedLocales**. The Payload admin opens globals in the **default locale (`en`)**, which is read-only for them, so the form looks uneditable until they switch the locale picker. Verified empirically: a `cz` country-admin's write to `newsletter.ctaText` and `landing-page.hero.ctaText` persisted in `cz` but was `Forbidden` in `en`.

2. **Menu bar text (WGT-51)** — _genuinely not editable, never was._ Header/footer nav labels come from `useTranslations('header'|'footer')` → static `src/messages/{locale}.json`, bundled at build time. No CMS field exists (and none ever did). This is a missing feature, not a regression.

3. **Site Settings / social media (WGT-52)** — _locked by design._ `site-settings.socialLinks` is a **non-localized array**; the field-locker (`lockNonLocalizedFieldsForCountryAdmins`, special case for non-localized arrays) locks the whole array to super-admins, so a country-admin's add is **silently dropped** (no error). Decision: social accounts are per-country → make `socialLinks` `localized: true`.

## Feature 1 — CMS-editable header menu labels (WGT-51)

Mirror the existing `headerCtaText` "override, else fall back to translation" pattern.

- **Schema** — `src/globals/SiteSettings.ts`, General tab, after `headerCtaUrl`: a non-localized group `headerNav` with 6 **localized, optional** text fields matching the actual menu bar items: `about, course, howItWorks, events, blog, contact`. (`faq` is excluded — it's in the translation file but not in the header menu.) Admin description: "Leave empty to use the default translation."
- **Rendering** — `src/components/Header.tsx`: add a `navOverrides` prop; change the single `navLinks` array so each label is `navOverrides?.<key>?.trim() || t('nav.<key>')`. `MobileMenu` already receives `navLinks` from `Header`, so it inherits overrides with no change.
- **Wiring** — `src/app/(frontend)/[locale]/layout.tsx`: pass `navOverrides={headerOverrides.headerNav}` and `ctaText={headerOverrides.headerCtaText}`.
- **Fallback fix (important)** — the override fields are `localized: true` and the global config sets `fallback: true`, so an empty `cz` override would resolve to the `en` override value — making `cz` show the English CMS override instead of the `cz.json` translation. Fix: read these specific fields with **fallback disabled** via `getHeaderOverrides(locale)` (`src/lib/getSiteSettings.ts`, `findGlobal({ fallbackLocale: 'none' })`), so an empty per-locale override reads as empty and the `|| t('nav.<key>')` translation fallback fires correctly. `headerCtaUrl`, `socialLinks`, `siteName`, meta etc. keep fallback (read via `getSiteSettings`) — for those, falling back to the default locale is desired. This also fixes the same latent bug for `headerCtaText` (its admin description already promised "leave empty → use the default translation").
- **Out of scope:** footer nav stays translation-based (DoD: no footer regression → don't touch it). Localized leaves stay editable for country-admins via the existing `lockNonLocalizedFieldsForCountryAdmins` recursion.

## Feature 2 — Country-admin read-only locale banner (CTA UX guardrail)

Removes the "why is everything read-only" confusion behind both complaints.

- **Component** — `src/components/admin/LocaleReadOnlyBanner.tsx` (`'use client'`): `useAuth()` + `useLocale()` from `@payloadcms/ui`. Render nothing when no user, `role === 'super-admin'`, or `assignedLocales.includes(locale.code)`. Otherwise show a warning: viewing "{locale.label}" is read-only; switch the locale selector to one of your locales ({assigned labels}). Distinct copy when the user has zero assigned locales.
- **Registration (DRY)** — `src/lib/access.ts`: add `prepareGlobalFields(fields)` = `[localeEditHintField, ...lockNonLocalizedFieldsForCountryAdmins(fields)]`, where `localeEditHintField` is a `ui` field whose `admin.components.Field` points to the banner. Swap the 6 locale-restricted globals' `fields:` calls (LandingPage, Newsletter, SiteSettings, BlogPage, ContactsPage, EventsPage) from `lockNonLocalizedFieldsForCountryAdmins([...])` to `prepareGlobalFields([...])`.
- Run `pnpm generate:importmap` to register the component.

## Feature 3 — Per-locale social links (WGT-52)

- **Schema** — `src/globals/SiteSettings.ts`: add `localized: true` to the `socialLinks` array. The field-locker leaves localized arrays editable, so country-admins can add/edit them in their assigned locale (gated by the locale rule); other locales are unaffected. With `fallback: true`, locales without their own links display the default-locale set.
- **Migration** — `scripts/migrate-sociallinks-localized.ts` (mirrors `migrate-trustlogos-localized.ts`): wraps the existing non-localized `socialLinks` array into `{ [defaultLocale]: [...] }` so current data survives the field becoming localized. Idempotent, `--dry` support. **Run once per environment (local → staging → prod) BEFORE editors save site-settings on the new schema.** Not run automatically here (DB migrations are operator-run).
- **Rendering** — `Footer.tsx` and `layout.tsx` consume `settings.socialLinks` from `getSiteSettings(locale)`, which already resolves per-locale; the array shape is unchanged, so no rendering changes are needed.
- Verified: a `cz` country-admin added a social link (`0 → 1`) while `lt` stayed `0 → 0`.

## Verification

- `pnpm generate:types`, `pnpm generate:importmap`, `pnpm exec prettier --write`, `pnpm lint`, `npx tsc --noEmit`.
- Local API probe: set `site-settings.headerNav.about` in `cz`, read back; confirm empty override → translation fallback. (Reuse the CTA-probe approach; the `afterChange` revalidation hook throws outside a Next request, so judge by read-back, not the thrown error.)
- **Limitation:** the admin banner render and the live header label cannot be visually verified in this environment (no browser libs / no sudo). Needs a browser-capable env or human check on staging.

## Out of scope / non-goals

- No change to the access logic itself (the locale gate is intentional).
- No footer nav editability.
- No auto-switching of the admin locale (explicitly declined; banner only).
