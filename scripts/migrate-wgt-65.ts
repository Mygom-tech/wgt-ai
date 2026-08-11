/**
 * WGT-65 one-off migration for the `landing-page` global. Two reshapes, one
 * atomic write — they must land together or the site is half broken.
 *
 * Part A — hero.heading: textarea -> richText
 *   Before: hero.heading = { en: "Technology\nshould work\nfor everyone.", ... }
 *           hero.highlightWord = { en: "everyone", ... }
 *   After:  hero.heading = { en: { root: { children: [paragraph, ...] } }, ... }
 *   The highlight word is folded into a bold text node, reproducing the legacy
 *   per-line highlight rule exactly. `hero.highlightWord` is left in the DB as a
 *   rollback reference — Payload rewrites the whole `hero` subdocument on the
 *   next admin save, so it cleans itself up.
 *
 * Part B — four Program arrays become localized
 *   Before: skills.items = [ { title: { en, lt }, description: {...}, image, id } ]
 *   After:  skills.items = { en: [ { title, description, image, id } ], lt: [...] }
 *   All 9 locales are seeded: the locale's own translation where it exists, the
 *   English value otherwise. A row with nothing in either is dropped from that
 *   locale rather than written with empty `required` fields. Locale keys that
 *   are no longer configured are carried over so nothing is lost. Payload does
 *   NOT auto-migrate when a field becomes localized, so without this the
 *   existing rows become unreadable.
 *
 * Idempotent and safe to re-run: anything already in the new shape is skipped
 * with a warning.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-wgt-65.ts --dry   # inspect only, writes nothing
 *   pnpm tsx scripts/migrate-wgt-65.ts         # apply
 *
 * Run once per environment (local -> staging -> prod) against a DB snapshot
 * first, then delete this file. VERIFY `DATABASE_URL` IN .env BEFORE RUNNING.
 */
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { defaultLocale, localeCodes } from '../src/i18n/locales'
import {
  LEGACY_HIGHLIGHT_FALLBACK,
  heroLinesToHeadingValue,
  heroLinesToText,
  heroTextToLines,
} from '../src/lib/hero-heading'

const GLOBAL_SLUG = 'landing-page'
const SCRIPT = 'migrate-wgt-65'
const REPORT_PATH = `${SCRIPT}-report.json`

// Refuse to run on an unrecognised argument. A typo like `---dry` must NOT be
// read as "no --dry flag, go ahead and write" — this script is destructive and
// the dry run is the only safety net.
const ARGS = process.argv.slice(2)
const UNKNOWN_ARGS = ARGS.filter((arg) => arg !== '--dry')

if (UNKNOWN_ARGS.length > 0) {
  console.error(
    `[${SCRIPT}] [main]: Failed to start. Unrecognised argument(s): ${UNKNOWN_ARGS.join(' ')}. ` +
      `The only supported flag is "--dry". Refusing to run so a typo cannot trigger a real write.`,
  )
  process.exit(1)
}

const DRY_RUN = ARGS.includes('--dry')

const log = {
  attempting: (fn: string, message: string) =>
    console.log(`[${SCRIPT}] [${fn}]: Attempting to ${message}`),
  success: (fn: string, message: string) =>
    console.log(`[${SCRIPT}] [${fn}]: Successfully ${message}`),
  failed: (fn: string, message: string, error: unknown) =>
    console.error(`[${SCRIPT}] [${fn}]: Failed to ${message}. ${error}`),
  warn: (fn: string, message: string) => console.warn(`[${SCRIPT}] [${fn}]: WARNING: ${message}`),
  info: (fn: string, message: string) => console.log(`[${SCRIPT}] [${fn}]: ${message}`),
}

type Doc = Record<string, unknown>
type Updates = Record<string, unknown>

/** Operator-facing findings collected while transforming, reported once at the end. */
type MigrationReport = {
  /** Values copied from the default locale — they will not track future edits. */
  englishFills: string[]
  /** Rows dropped because a `required` field had no value in any usable locale. */
  incomplete: string[]
}

/** A row built for one locale, or the reason it was dropped from that locale. */
type RowResult = { row: Doc } | { row: null; reason: 'empty' | 'incomplete' }

/** Read a dotted path out of the raw mongo document. */
function getAtPath(doc: Doc, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined
    return (acc as Doc)[key]
  }, doc)
}

function isPlainObject(value: unknown): value is Doc {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

// ─── Part A: hero.heading -> richText ───────────────────────────────────────

/**
 * Build the per-locale rich text values. Locales whose heading is missing stay
 * absent — an empty lexical root is not null, so `fallback: true` would never
 * fire for them and the site would render an empty <h1>.
 */
function migrateHeroHeading(doc: Doc, updates: Updates): number {
  const fn = 'migrateHeroHeading'
  const hero = doc.hero
  const heading = isPlainObject(hero) ? hero.heading : undefined
  const highlight = isPlainObject(hero) ? hero.highlightWord : undefined

  if (heading == null) {
    log.info(fn, 'hero.heading is absent. Nothing to convert.')
    return 0
  }

  // `heading` has been `localized: true` since it was introduced, so it is
  // always a locale-keyed object. A bare string would mean a schema we never
  // shipped — warn and skip rather than guess how to reshape it.
  if (!isPlainObject(heading)) {
    log.warn(fn, `hero.heading has an unexpected type (${typeof heading}). Skipping.`)
    return 0
  }

  const defaultWord = isPlainObject(highlight) ? highlight[defaultLocale] : undefined

  // One pass, three exhaustive states. Blank/whitespace-only headings are left
  // ABSENT, not written as an empty lexical root: an empty root is not null, so
  // `fallback: true` would stop firing for that locale AND the required-field
  // validation would block the next admin save.
  const blank: string[] = []
  const pending: string[] = []
  const alreadyRichText: string[] = []

  for (const [locale, value] of Object.entries(heading)) {
    if (typeof value === 'string') (value.trim() ? pending : blank).push(locale)
    else if (isPlainObject(value)) alreadyRichText.push(locale)
  }

  if (blank.length > 0) {
    log.warn(
      fn,
      `locales [${blank.join(', ')}] have a blank heading — leaving them unset so they keep ` +
        `falling back to "${defaultLocale}".`,
    )
  }

  if (pending.length === 0) {
    log.info(fn, `hero.heading is already rich text for [${alreadyRichText.join(', ')}]. Skipping.`)
    return 0
  }

  if (alreadyRichText.length > 0) {
    // An editor saved the global on the new schema before this migration ran,
    // which means those locales' original text may be gone. Same failure mode
    // documented in scripts/migrate-trustlogos-localized.ts.
    log.warn(
      fn,
      `locales [${alreadyRichText.join(', ')}] are already rich text while [${pending.join(', ')}] ` +
        `are not. An editor likely saved before this migration ran — verify those headings by hand.`,
    )
  }

  for (const locale of pending) {
    const text = heading[locale] as string
    // `||`, not `??`: Payload's fallback for text fields fires on an empty
    // string too, so an editor who blanked the word saw the English one.
    const rawWord = isPlainObject(highlight) ? highlight[locale] || defaultWord : defaultWord
    const word = typeof rawWord === 'string' ? rawWord : undefined

    if (word && word !== word.trim()) {
      log.warn(
        fn,
        `highlightWord for "${locale}" is "${word}" (surrounding whitespace). It is matched ` +
          `verbatim, exactly as the live site does today — clean the copy up in the admin afterwards.`,
      )
    }
    if (!word) {
      log.info(
        fn,
        `no highlightWord stored for "${locale}" — falling back to "${LEGACY_HIGHLIGHT_FALLBACK}", ` +
          `which is what the site renders today.`,
      )
    }

    const lines = heroTextToLines(text, word)
    const accented = lines.filter((line) => line.some((segment) => segment.accent)).length

    if (accented === 0) {
      log.warn(
        fn,
        `nothing accented in the "${locale}" heading — it will render monochrome, same as today.`,
      )
    }
    // Compare whole lines, not segments: splitting around the highlight word
    // legitimately produces segments like "for " with a trailing space.
    const preview = heroLinesToText(lines).split('\n')
    if (preview.some((line) => line !== line.trim())) {
      log.warn(
        fn,
        `the "${locale}" heading has leading/trailing whitespace on a line — preserved as-is.`,
      )
    }

    log.attempting(fn, `convert locale "${locale}" (${lines.length} line(s), ${accented} accented)`)
    console.log(`  ${preview.join('\n  ')}`)

    updates[`hero.heading.${locale}`] = heroLinesToHeadingValue(lines)
  }

  return pending.length
}

// ─── Part B: Program arrays -> localized ────────────────────────────────────

type ArraySpec = {
  /** Dotted path inside the raw `globals` document. */
  path: string
  label: string
  /** Inner fields stored today as { en: ..., lt: ... }. Everything else is copied verbatim. */
  localizedFields: readonly string[]
}

const ARRAYS: readonly ArraySpec[] = [
  { path: 'skills.items', label: 'Skills > items', localizedFields: ['title', 'description'] },
  { path: 'skills.benefits', label: 'Skills > benefits', localizedFields: ['text'] },
  {
    path: 'howItWorks.steps',
    label: 'How It Works > steps',
    localizedFields: ['title', 'description'],
  },
  {
    path: 'audience.groups',
    label: 'Audience > groups',
    localizedFields: ['title', 'description'],
  },
]

/**
 * Locale keys present in the stored data but no longer configured (e.g. the
 * legacy `cs` before it was renamed to `cz`). The `$set` replaces the whole
 * array path, so a key we do not emit is destroyed — we keep them instead.
 * Payload ignores unknown locale buckets on read.
 */
function unconfiguredLocaleKeys(rows: unknown[], spec: ArraySpec): string[] {
  const keys = new Set<string>()

  for (const rawRow of rows) {
    if (!isPlainObject(rawRow)) continue
    for (const field of spec.localizedFields) {
      const value = rawRow[field]
      if (isPlainObject(value)) Object.keys(value).forEach((key) => keys.add(key))
    }
  }

  return [...keys].filter((key) => !(localeCodes as readonly string[]).includes(key))
}

/**
 * Build one row for one locale, or drop it.
 *
 * Every written document must validate: `title`/`description`/`text` are
 * `required`, so a row carrying an empty one makes Payload reject the WHOLE
 * locale on save — including the mandatory post-migration Save that busts the
 * Next.js cache. A row is therefore dropped when any localized field resolves
 * to nothing, whether that is all of them (`empty`) or only some
 * (`incomplete`).
 *
 * We deliberately do NOT borrow a value from some other locale to fill the gap:
 * putting Czech text on the English page is a silent content bug, and the row
 * can be re-added in the admin from the report.
 */
function localizeRow(
  row: Doc,
  spec: ArraySpec,
  locale: string,
  index: number,
  report: MigrationReport,
): RowResult {
  const next: Doc = {}
  const blankFields: string[] = []
  let hasContent = false

  // Non-localized members (`image`, `id`) are copied verbatim into every locale.
  for (const [key, value] of Object.entries(row)) {
    if (!spec.localizedFields.includes(key)) next[key] = value
  }

  // Driven by the spec, not by the row's own keys: a localized field that is
  // missing from the row entirely still has to be reported, or it lands as an
  // absent `required` value that blocks the next admin save.
  for (const key of spec.localizedFields) {
    const value = row[key]

    // Defensive: this field was never actually localized in this row.
    if (value != null && !isPlainObject(value)) {
      next[key] = value
      if (value === '') blankFields.push(key)
      else hasContent = true
      continue
    }

    const byLocale = isPlainObject(value) ? value : {}

    const own = byLocale[locale]
    if (own !== undefined && own !== null && own !== '') {
      next[key] = own
      hasContent = true
      continue
    }

    const fallback = byLocale[defaultLocale]
    if (fallback !== undefined && fallback !== null && fallback !== '') {
      if (locale !== defaultLocale) {
        report.englishFills.push(`${locale}: ${spec.path}[${index}].${key}`)
      }
      next[key] = fallback
      hasContent = true
      continue
    }

    next[key] = ''
    blankFields.push(key)
  }

  if (blankFields.length === 0) return { row: next }

  // Partial content is worth naming individually: the row existed and had
  // something in it, so someone probably wants it back once the missing field
  // is written. A wholly empty row is just structural debris.
  if (hasContent) {
    report.incomplete.push(
      `${locale}: ${spec.path}[${index}] dropped — no value for {${blankFields.join(', ')}}`,
    )
    return { row: null, reason: 'incomplete' }
  }

  return { row: null, reason: 'empty' }
}

/**
 * Reshape one legacy array into a locale-keyed object, seeding every locale.
 * Non-localized inner fields (`image`) and the row `id` are copied verbatim —
 * row ids only need to be unique within a single array, and the locale buckets
 * are disjoint, so reuse keeps re-runs byte-reproducible.
 */
function localizeRows(
  rows: unknown[],
  spec: ArraySpec,
  locales: readonly string[],
  report: MigrationReport,
): Record<string, unknown[]> {
  const fn = 'localizeRows'
  const out: Record<string, unknown[]> = {}
  const droppedBy: Record<number, string[]> = {}

  rows.forEach((rawRow, index) => {
    if (isPlainObject(rawRow)) return
    log.warn(
      fn,
      `${spec.path}[${index}] is not an object (${rawRow === null ? 'null' : typeof rawRow}). ` +
        `It is dropped from every locale and the original value is lost.`,
    )
  })

  for (const locale of locales) {
    out[locale] = rows.flatMap((rawRow, index) => {
      const row = isPlainObject(rawRow) ? rawRow : {}
      const result = localizeRow(row, spec, locale, index, report)
      const next = result.row

      if (!next) {
        // Only the wholly-empty case is aggregated here; `incomplete` rows are
        // already listed per field in the report.
        if (result.reason === 'empty') {
          droppedBy[index] = [...(droppedBy[index] ?? []), locale]
        }
        return []
      }

      return [next]
    })
  }

  for (const [index, dropped] of Object.entries(droppedBy)) {
    log.warn(
      fn,
      `${spec.path}[${index}] has no content for [${dropped.join(', ')}] and no "${defaultLocale}" ` +
        `value to copy — dropped from those locale(s). Re-add it in the admin if it belongs there.`,
    )
  }

  return out
}

function migrateProgramArrays(doc: Doc, updates: Updates, report: MigrationReport): number {
  const fn = 'migrateProgramArrays'
  let migrated = 0

  for (const spec of ARRAYS) {
    const current = getAtPath(doc, spec.path)

    if (current == null) {
      log.info(fn, `${spec.label} is absent. Nothing to seed.`)
      continue
    }

    if (!Array.isArray(current)) {
      if (isPlainObject(current)) {
        const keys = Object.keys(current)
        if (keys.length > 0 && !keys.includes(defaultLocale)) {
          log.warn(
            fn,
            `${spec.label} has locales [${keys.join(', ')}] but no "${defaultLocale}". The legacy ` +
              `rows were likely lost (an editor saved before this migration ran). Re-enter them manually.`,
          )
        } else {
          log.info(fn, `${spec.label} is already locale-keyed. Skipping.`)
        }
      } else {
        log.warn(fn, `${spec.label} has an unexpected type (${typeof current}). Skipping.`)
      }
      continue
    }

    const orphanKeys = unconfiguredLocaleKeys(current, spec)
    if (orphanKeys.length > 0) {
      log.warn(
        fn,
        `${spec.label} holds translations for unconfigured locale(s) [${orphanKeys.join(', ')}]. ` +
          `They are carried over so nothing is lost, but Payload will not read them — migrate or ` +
          `delete them by hand.`,
      )
    }

    const locales = [...localeCodes, ...orphanKeys]
    log.attempting(fn, `seed ${spec.label}: ${current.length} row(s) x ${locales.length} locale(s)`)

    const seeded = localizeRows(current, spec, locales, report)
    updates[spec.path] = seeded

    // Show the resulting shape rather than making the operator infer it — rows
    // can be dropped per locale, so the counts are not always uniform.
    const counts = Object.entries(seeded)
      .map(([locale, rows]) => `${locale}:${rows.length}`)
      .join(' ')
    log.info(fn, `  ${spec.label} -> ${counts}`)

    migrated += 1
  }

  return migrated
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main() {
  const fn = 'main'
  log.attempting(fn, `migrate the "${GLOBAL_SLUG}" global (dry=${DRY_RUN})`)

  const payload = await getPayload({ config })
  const collection = payload.db.connection.collection('globals')

  // The mongoose adapter stores all globals in one `globals` collection,
  // discriminated by `globalType`.
  const doc = await collection.findOne({ globalType: GLOBAL_SLUG })

  if (!doc) {
    log.info(fn, `No "${GLOBAL_SLUG}" global document found. Nothing to do.`)
    return
  }

  const updates: Updates = {}
  const report: MigrationReport = { englishFills: [], incomplete: [] }

  const headingLocales = migrateHeroHeading(doc as Doc, updates)
  const arrayPaths = migrateProgramArrays(doc as Doc, updates, report)

  if (report.englishFills.length > 0) {
    log.warn(
      fn,
      `${report.englishFills.length} field(s) were filled from "${defaultLocale}" — hand this list to ` +
        `whoever does translations, those values will NOT update when the English copy changes:`,
    )
    for (const entry of report.englishFills) console.warn(`  - ${entry}`)
  }

  if (report.incomplete.length > 0) {
    log.warn(
      fn,
      `${report.incomplete.length} row(s) had partial content and were dropped rather than written ` +
        `with an empty required field. Re-add them in the admin once the missing copy exists:`,
    )
    for (const entry of report.incomplete) console.warn(`  - ${entry}`)
  }

  // Persist the findings: they have to reach the translators and whoever
  // re-adds the dropped rows, and terminal scrollback is not a hand-off
  // mechanism.
  if (report.englishFills.length > 0 || report.incomplete.length > 0) {
    try {
      writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
      log.info(fn, `Report written to ${REPORT_PATH}`)
    } catch (error: unknown) {
      // Non-fatal: the same content was just printed above.
      log.failed(fn, `write the report to ${REPORT_PATH}`, error)
    }
  }

  if (Object.keys(updates).length === 0) {
    log.info(fn, 'Nothing left to migrate. Exiting without writing.')
    return
  }

  if (DRY_RUN) {
    log.info(
      fn,
      `--dry: would write ${headingLocales} heading locale(s) and ${arrayPaths} array path(s):`,
    )
    console.log(JSON.stringify(updates, null, 2))
    log.success(fn, 'complete the dry run — no changes written.')
    return
  }

  try {
    const result = await collection.updateOne(
      // Optimistic concurrency. `updates` was derived from the earlier read and
      // the $set replaces whole array paths, so a save that landed in between
      // would be silently overwritten — and this global has no `versions`
      // config, so there would be no undo. Matching on the read's `updatedAt`
      // makes that collision fail loudly instead.
      { _id: doc._id, updatedAt: doc.updatedAt },
      { $set: updates },
    )

    if (result.matchedCount === 0) {
      throw new Error(
        `The "${GLOBAL_SLUG}" global changed since it was read (updatedAt=${String(doc.updatedAt)}). ` +
          `Someone saved it in the admin mid-run. NOTHING was written — re-run the --dry pass and start over.`,
      )
    }

    log.success(
      fn,
      `write ${headingLocales} heading locale(s) and ${arrayPaths} array path(s) ` +
        `(matched=${result.matchedCount} modified=${result.modifiedCount})`,
    )
  } catch (error: unknown) {
    log.failed(fn, 'write the migration to MongoDB', error)
    throw error
  }

  log.info(
    fn,
    'NEXT: open the Landing Page global in the admin and hit Save once. This write bypassed Payload ' +
      'hooks, so the Next.js data cache still holds the pre-migration content.',
  )
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    log.failed('main', `migrate the "${GLOBAL_SLUG}" global`, error)
    process.exit(1)
  })
