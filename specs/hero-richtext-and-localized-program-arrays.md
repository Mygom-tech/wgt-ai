# Hero rich text heading + per-locale Program arrays (WGT-65)

Ticket: WGT-65 "lokalių įtaka viena kitai" (locales influencing each other).

## Context

Two defects in the `landing-page` global, both caused by the same root mistake: **localization applied at the wrong level of the field tree.**

1. **`hero.heading` was a `textarea`.** The accent colour came from a separate `hero.highlightWord` text field that string-matched the first case-insensitive **substring per line** — so `"one"` highlighted inside `"everyone"`, it fired on every line containing the word, and clearing it silently fell back to a hardcoded `'everyone'`. Flipping the field to `richText` in isolation throws _"heading is not an object"_, because the stored value is a plain string per locale.

2. **Four `array` fields in the `Program` tab were not localized, but their inner fields were.** Payload stored one shared array structure with per-locale leaves, so **adding or deleting a row in EN added/deleted it in all 9 locales**. `lockNonLocalizedFieldsForCountryAdmins` (`src/lib/access.ts`) deliberately leaves such arrays structurally editable for country-admins, which meant a Bulgarian admin deleting a Skills row deleted it for every other country. This was a live cross-tenant write, not just a UX annoyance.

Locales (9): `en` (default), `bg`, `cz`, `lv`, `lt`, `md`, `pl`, `ro`, `ee` — `src/i18n/locales.ts`. `localization.fallback: true`.

## Feature 1 — `hero.heading` as rich text

- **Schema** — `src/globals/LandingPage.ts`: `heading` is now `type: 'richText'`, still `localized: true, required: true`, with the repo's **first per-field `editor` override**. It fully replaces the project-wide editor from `payload.config.ts` and offers only inline formatting — `ParagraphFeature`, `BoldFeature`, `ItalicFeature`, `UnderlineFeature`, `StrikethroughFeature`, plus the two toolbars. No headings, lists, links, uploads, tables or blocks, which would all be nonsense inside an animated H1. `hero.highlightWord` is **deleted**.
- **Convention: bold = accent.** Bold renders in `text-primary` (teal), *not* heavier. Every other format renders literally (`italic`, `underline`, `line-through`), so bold is deliberately the odd one out — documented in the field's `admin.description`. The honest alternative, `TextStateFeature`, gives a real colour picker that shows teal inside the editor, but it is `@experimental` in Payload 3.77 and switching now would require a second migration to rewrite `format: 1` marks as `$: { color: 'accent' }` across nine locales. If editors trip over it, the swap is contained: `formatOf()` in `src/lib/hero-heading.ts` reads `node.$?.color === 'accent'` instead of the `IS_BOLD` bit, and `renderChars` stops special-casing `accent`.
- **Adding a format later** is three edits: register the feature in `LandingPage.ts`, add the flag to `HeroFormat` + `formatOf`/`bitmaskOf` in `hero-heading.ts`, and map it to a class in `renderChars`. Decorations are applied per character rather than to a segment wrapper — the chars are `inline-block` under negative tracking, so the boxes abut and an underline reads as continuous while each char stays an independent GSAP target.
- **`decorationClasses` in `Hero.tsx` must stay a single branch, not two `cn()` conditions.** `underline` and `line-through` are the same CSS property (`text-decoration-line`), so emitting both utilities together makes one silently win regardless of class order — underline+strikethrough rendered as strikethrough only. The combined case emits `[text-decoration-line:underline_line-through]`, one declaration listing both values. Verified by compiling `globals.css` through `@tailwindcss/postcss` and asserting the rule is generated: the class lives inside a template literal, and Tailwind's scanner still extracts it because the literal substring is present in the source.
- **Line semantics** — one paragraph (Enter) = one visual line, and a `linebreak` node (Shift+Enter) also starts a new line. Both must be honoured: `src/lib/useFitText.ts` measures the **direct children** of the `<h1>`, so collapsing a multi-line heading into one `whitespace-nowrap` span would clamp at `minScale 0.5` and overflow on mobile.
- **Blank lines** — only **trailing** blank lines are dropped (the normal editor artefact). An interior or leading blank line is preserved, because the old textarea rendered it as a real block of vertical space, and because the muted first-line colour is index-based (`i === 0 ? 'text-foreground/70'`) — silently removing a leading blank would move the dimming onto the first visible word.
- **Accent fallback** — the old renderer did `hero.highlightWord || 'everyone'`, so headings with no `highlightWord` row still showed "everyone" in teal. `LEGACY_HIGHLIGHT_FALLBACK` reproduces that, and the word is matched **verbatim** (not trimmed) so a stored value with stray whitespace migrates to exactly what the site renders today. The script logs when it falls back or when a whitespace-padded word is used.
- **Util** — `src/lib/hero-heading.ts`, pure and React-free so the migration script can import it from plain Node. `heroHeadingToLines(value: unknown)` accepts a Lexical root **or a legacy plain string**, so an unmigrated environment degrades to plain un-accented lines instead of crashing. It never throws; it returns `[]` for anything unrenderable and the caller falls back to `DEFAULT_HERO_HEADING_LINES`.
  - This is the **third** hand-rolled Lexical walker in the repo (`src/components/RichTextRenderer.tsx`, `src/lib/lexical-html.ts`). The traversals stay separate — they emit three different things (segment arrays, JSX, an HTML string), and only this one treats a `linebreak` node as a visual line break. What *was* shared is the format bitmask, which had reached three copies (one of them bare magic numbers in `lexical-html.ts`): it now lives in `src/lib/lexical-format.ts`, which is React-free so the Node migration script can reach it transitively.
- **Rendering** — `src/sections/Hero.tsx` is otherwise untouched: the `<h1>`, one `block whitespace-nowrap` child per line, the `data-hero-char` span per character, the `opacity-0` starting state, and the line-0 `text-foreground/70` dimming all survive. **A character stuck at `opacity-0` is the canary** for a span that lost its `data-hero-char` attribute.
- **Page fallback** — the hardcoded hero object in `src/app/(frontend)/[locale]/page.tsx` was removed (its `heading: string` no longer compiles, and embedding Lexical JSON in a page component would be grotesque). `hero` is now guarded at render like every other section.

## Feature 2 — Per-locale Program arrays

- **Schema** — `src/globals/LandingPage.ts`: `skills.items`, `skills.benefits`, `howItWorks.steps` and `audience.groups` are now `localized: true`, and `localized: true` was **removed from their inner fields**. Payload 3.77 silently deletes a nested `localized` flag, so this is cosmetic honesty rather than a functional requirement — but leaving it would be a lie in the source. Matches the two arrays that already got this treatment: `hero.trustLogos` and `SiteSettings.socialLinks` (see `specs/localized-content-editing.md`).
  - `skills.benefits` was **not** in the ticket. It had the identical bug and shipped in the same change.
- **Access control** — no code change. Once the array is localized, `processField` early-returns and the whole subtree becomes country-admin editable, **including the non-localized `image` upload inside a row**. This is not privilege escalation: the row lives in a per-locale array, so the change cannot reach another locale, and country-admins already have create/update on `images`.
- **Rendering** — no frontend change. The API returns the requested locale's array, so `Skills.tsx`, `HowItWorks.tsx`, `Audience.tsx` and the JSON-LD `teaches` map see an identical runtime shape.
- **Generated types** — `hero.heading` becomes the Lexical root object and `highlightWord` disappears, but **the four arrays produce no shape change**: generated types describe a single-locale read.
- **`maxRows` is now enforced per locale** (3 / 3 / 4), which is the correct behaviour.

### The trade this buys, stated plainly

Before, the fallback unit was the individual field: a `pl` row with a translated `title` but an empty `description` fell back to the English description **and stayed fresh when English changed**. Now the fallback unit is the whole array, and the migration seeds every locale, so **EN-filled values are frozen permanently**. Editing the English copy in six months will not propagate; structural changes become a 9-locale chore.

This is inherent to "rows are per-country" and is the accepted cost of fixing the cross-locale write. The mitigation is operational: the migration prints a per-locale report of every field it filled from English — hand that list to whoever does translations.

The alternative (seed only locales with real translations, rely on `fallback: true`) was rejected because the admin reads documents with `fallbackLocale: false`. A `ro` editor would open an empty Skills array while the live site showed 4 English cards, add one row, save, and lose the other three — `fallback` fires on `undefined`, never on `[]`.

## Migration — `scripts/migrate-wgt-65.ts`

One script, one atomic `$set`, so the two reshapes cannot half-land. Follows the raw-driver convention of `scripts/migrate-trustlogos-localized.ts` (`payload.db.connection.collection('globals')`, `{ globalType: 'landing-page' }`), which bypasses mongoose schemas and therefore runs against either code version. `--dry` writes nothing. Idempotent: anything already in the new shape is skipped, and a **mixed** state raises a loud warning because it means an editor saved on the new schema before the migration ran.

- **Part A** — every locale whose `hero.heading` is a **non-blank** string becomes Lexical JSON, with `highlightWord[locale] || highlightWord[en] || 'everyone'` folded into a bold text node. `heroTextToLines` reproduces the legacy **per-line** highlight rule byte-for-byte, so existing headings do not visibly change. Locales whose heading is missing **or blank/whitespace-only** are left **absent**, not written as an empty root: an empty Lexical root is not `null`, so `fallback: true` would stop firing for that locale (the site would show the English demo copy) and the `required` validation would block the next admin save.
- **Part B** — table-driven over the four array paths; they differ only in path and which inner fields are locale-keyed. Each legacy row is expanded into all 9 locales, resolving `row[field][locale] ?? row[field][en] ?? ''`. Non-localized inner fields (`image`) and the row `id` are copied verbatim — row ids only need uniqueness within a single array and the locale buckets are disjoint, so reuse keeps re-runs byte-reproducible.
  - **Unconfigured locale keys are carried over, not dropped.** The `$set` replaces the whole array path, so any key still in the data but no longer in `localeCodes` — `cs` is a real example, renamed to `cz` in commit b6c223b — would be destroyed. `storedLocaleKeys` collects them, the script warns, and they are written through so the translations remain recoverable even though Payload will not read them.
  - **A row with no content for a locale is dropped from that locale**, not written with empty strings. This is the case where the locale has no translation *and* the default locale has nothing to copy from — a row someone created in another locale without ever writing the original. It already renders as a blank card, and writing it back would leave empty `required` fields that block the next admin save of the global. Observed live in this data: `skills.items[7]` ("AI for Vibe Coding") exists only in `cz/lv/lt/pl/ro`, so `en/bg/md/ee` end up with 7 cards and the rest keep 8. The script warns with the row index and the affected locales.
  - **Rows that are not objects** (a stray `null` or string from an earlier partial write) are dropped from every locale. The script warns per row rather than doing it silently.
  - **A *partially* blank row is kept and reported.** Field resolution is driven by the spec's `localizedFields`, not by the row's own keys, so a localized field that is missing from the row entirely is still caught. Those fields land as `''` and will fail `required` validation the next time an editor saves that locale, so the script prints them under "kept row(s) have an empty required field" for manual follow-up.
  - The dry run prints the resulting per-locale row counts (`Skills > items -> en:7 bg:7 cz:8 …`) so the shape is visible before anything is written.
- **`hero.highlightWord` is left in the database** as a rollback reference. Payload rewrites the whole `hero` subdocument on save, so it disappears by itself the first time anyone saves the global. No cleanup script needed.

### Runbook (per environment: local → staging → prod)

1. `mongodump` the `globals` collection. **Check `DATABASE_URL` in `.env` first** — the script connects to whatever is there, and one wrong value means a reshape against production from a laptop.
2. Announce a CMS freeze on the Landing Page global.
3. Deploy the new build.
4. `pnpm tsx scripts/migrate-wgt-65.ts --dry` — read the accent warnings and the English-fill report.
5. `pnpm tsx scripts/migrate-wgt-65.ts`
6. **Open the Landing Page global in the admin and hit Save once.** Not optional — see below.
7. Smoke test, then lift the freeze. Delete the script once every environment is done.

### Why the ordering is deploy-first

Neither direction is free, but only one of them takes the site down.

- **Migrate first:** the old code reads `{ en: [...] }` and calls `.map` on an object in `Skills.tsx` → 500 on `/`; `Hero.tsx` calls `.split` on an object → client crash.
- **Deploy first:** the new code tolerates unmigrated data by design, so the damage is **cosmetic** — the accent word disappears from the H1 and the Skills / How It Works / Audience sections render empty until the migration runs.

The real hazard in that window is an **editor saving the global**, which writes `{ lt: [] }` over the legacy rows. This global has no `versions` config, so there is no undo — this exact failure already cost the project 6 trust logos once (documented in `scripts/migrate-trustlogos-localized.ts`). Hence the freeze and the snapshot.

### Why step 6 is mandatory

`queryGlobal` (`src/lib/payload-data.ts`) wraps `findGlobal` in `unstable_cache` with a tag and **no TTL**. A raw-driver write never fires the `afterChange` revalidation hook, and the script cannot call `revalidateTag` (it throws outside a Next request context — the same limitation noted in `specs/localized-content-editing.md`). So any page rendered between deploy and migration — a single bot hit is enough — caches the pre-migration content, and on Vercel the Data Cache survives redeploys. One no-op Save in the admin busts the tag for all 9 locales. The script prints this as its final log line.

### Rollback

Snapshot-only. Feature 1 is mechanically reversible while `hero.highlightWord` survives in Mongo, but Feature 2 is genuinely lossy once any locale diverges — nine per-locale row lists cannot be collapsed back into one shared list with per-locale leaves.

## Verification

- `pnpm generate:types` (expect: heading → Lexical, `highlightWord` gone, arrays unchanged in shape), `npx tsc --noEmit`, `pnpm lint`, `pnpm test:int`.
- `tests/int/hero-heading.int.spec.ts` covers both legacy string forms, garbage input, the bold bitmask, `linebreak` splitting, segment merging, trailing empty paragraphs, the per-line highlight rule, and a full round trip.
- **Admin, super-admin:** the heading field offers only a Paragraph dropdown and a Bold button. All four arrays show seeded rows in each of the 9 locales; editing a row in `lt` leaves `en` untouched.
- **Admin, country-admin (`assignedLocales: ['lt']`):** `en` shows the read-only banner; `lt` allows add/remove/reorder **and** changing a row's image, landing in `lt` only. `maxRows` still caps within `lt`.
- **Frontend, several locales:** the H1 keeps its line breaks, the accent word is teal, and the character cascade runs. Resize → `--fit-scale` still changes. `prefers-reduced-motion: reduce` → all characters visible immediately. The three Program grids are populated in every locale.
- **Not verifiable in this environment:** the admin editor UI, the GSAP animation and the migration itself (no browser, and `.env` points at a remote cluster). Needs a human check on staging.

## Out of scope

`Events.speakers`, `Forms.steps`, `Forms.steps[].fields` (blocks) and `SelectField.options` have the same non-localized-container-with-localized-children pattern and are **not** fixed here. Localizing `Forms.steps` in particular would let form field `name` keys diverge per locale, fragmenting `FormSubmissions.submissionData` and the Omnisend field mapping — it needs its own design, not a copy of this migration.
