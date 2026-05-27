/**
 * One-off migration: reshape `landing-page.hero.trustLogos` from a legacy
 * non-localized array into a locale-keyed object so the now-`localized: true`
 * field keeps its existing data.
 *
 * Legacy shape:  hero.trustLogos = [ { image, id }, ... ]
 * New shape:     hero.trustLogos = { en: [ { image, id }, ... ] }
 *
 * Payload does NOT auto-migrate when a field becomes localized, so without this
 * the existing English logos become unreadable. Idempotent and safe to re-run:
 * if trustLogos is already a locale-keyed object (or absent), it is skipped.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-trustlogos-localized.ts --dry   # inspect only
 *   pnpm tsx scripts/migrate-trustlogos-localized.ts         # apply
 *
 * Run once per environment (local → staging → prod) against a DB snapshot
 * first, then delete this file.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { defaultLocale } from '../src/i18n/locales'

const GLOBAL_SLUG = 'landing-page'
const DRY_RUN = process.argv.includes('--dry')

async function main() {
  const payload = await getPayload({ config })
  const conn = payload.db.connection
  const collection = conn.collection('globals')

  // Mongoose adapter stores all globals in one `globals` collection,
  // discriminated by `globalType`.
  const doc = await collection.findOne({ globalType: GLOBAL_SLUG })

  if (!doc) {
    console.log(`[migrate] No "${GLOBAL_SLUG}" global document found. Nothing to do.`)
    return
  }

  const hero = (doc as Record<string, unknown>).hero as Record<string, unknown> | undefined
  const trustLogos = hero?.trustLogos

  if (trustLogos == null) {
    console.log('[migrate] hero.trustLogos is absent. Nothing to do.')
    return
  }

  if (!Array.isArray(trustLogos)) {
    // Already an object. Warn loudly if it lacks the default locale but has
    // other locales — that signals an editor saved the global on the new
    // localized schema BEFORE this migration ran, which drops the legacy
    // (English) array. The original `en` logos may be permanently gone.
    const keys = Object.keys(trustLogos as Record<string, unknown>)
    if (keys.length > 0 && !keys.includes(defaultLocale)) {
      console.warn(
        `[migrate] WARNING: hero.trustLogos has locales [${keys.join(', ')}] but no ` +
          `"${defaultLocale}". The legacy English logos were likely lost (an editor saved ` +
          `before this migration ran). Re-enter the English logos manually.`,
      )
    } else {
      console.log('[migrate] hero.trustLogos is already locale-keyed (object). Skipping.')
    }
    return
  }

  console.log(
    `[migrate] Found legacy array with ${trustLogos.length} logo(s). ` +
      `Will wrap into { ${defaultLocale}: [...] }.`,
  )

  if (DRY_RUN) {
    console.log('[migrate] --dry: no changes written.')
    return
  }

  const result = await collection.updateOne(
    { _id: doc._id },
    { $set: { 'hero.trustLogos': { [defaultLocale]: trustLogos } } },
  )

  console.log(
    `[migrate] Done. matched=${result.matchedCount} modified=${result.modifiedCount}. ` +
      `Existing logos now live under hero.trustLogos.${defaultLocale}.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[migrate] Failed:', error)
    process.exit(1)
  })
