/**
 * One-off migration: reshape `site-settings.socialLinks` from a legacy
 * non-localized array into a locale-keyed object so the now-`localized: true`
 * field keeps its existing data.
 *
 * Legacy shape:  socialLinks = [ { platform, url, id }, ... ]
 * New shape:     socialLinks = { en: [ { platform, url, id }, ... ] }
 *
 * Payload does NOT auto-migrate when a field becomes localized, so without this
 * the existing (English) social links become unreadable. Idempotent and safe to
 * re-run: if socialLinks is already a locale-keyed object (or absent), it is
 * skipped.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-sociallinks-localized.ts --dry   # inspect only
 *   pnpm tsx scripts/migrate-sociallinks-localized.ts         # apply
 *
 * Run once per environment (local → staging → prod) against a DB snapshot
 * first, then delete this file.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { defaultLocale } from '../src/i18n/locales'

const GLOBAL_SLUG = 'site-settings'
const FIELD = 'socialLinks'
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

  const socialLinks = (doc as Record<string, unknown>)[FIELD]

  if (socialLinks == null) {
    console.log(`[migrate] ${FIELD} is absent. Nothing to do.`)
    return
  }

  if (!Array.isArray(socialLinks)) {
    // Already an object. Warn loudly if it lacks the default locale but has
    // other locales — that signals an editor saved the global on the new
    // localized schema BEFORE this migration ran, which drops the legacy
    // (English) array. The original `en` links may be permanently gone.
    const keys = Object.keys(socialLinks as Record<string, unknown>)
    if (keys.length > 0 && !keys.includes(defaultLocale)) {
      console.warn(
        `[migrate] WARNING: ${FIELD} has locales [${keys.join(', ')}] but no ` +
          `"${defaultLocale}". The legacy English links were likely lost (an editor saved ` +
          `before this migration ran). Re-enter the English social links manually.`,
      )
    } else {
      console.log(`[migrate] ${FIELD} is already locale-keyed (object). Skipping.`)
    }
    return
  }

  console.log(
    `[migrate] Found legacy array with ${socialLinks.length} social link(s). ` +
      `Will wrap into { ${defaultLocale}: [...] }.`,
  )

  if (DRY_RUN) {
    console.log('[migrate] --dry: no changes written.')
    return
  }

  const result = await collection.updateOne(
    { _id: doc._id },
    { $set: { [FIELD]: { [defaultLocale]: socialLinks } } },
  )

  console.log(
    `[migrate] Done. matched=${result.matchedCount} modified=${result.modifiedCount}. ` +
      `Existing links now live under ${FIELD}.${defaultLocale}.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[migrate] Failed:', error)
    process.exit(1)
  })
