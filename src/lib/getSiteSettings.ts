import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SiteSetting } from '@/payload-types'
import { defaultLocale, localeCodes, type LocaleCode } from '@/i18n/locales'
import { globalTag } from './payload-data'

const defaults: SiteSetting = {
  id: '',
  siteName: 'Jarune',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  defaultMeta: {},
  socialLinks: [],
  updatedAt: '',
  createdAt: '',
}

async function fetchSiteSettings(locale?: LocaleCode): Promise<SiteSetting> {
  const keyParts = ['global', 'site-settings', '1', locale ?? '', 'false']

  return unstable_cache(
    async () => {
      try {
        const payload = await getPayload({ config })
        return await payload.findGlobal({
          slug: 'site-settings',
          depth: 1,
          locale,
          overrideAccess: true,
        })
      } catch {
        return null
      }
    },
    keyParts,
    { tags: [globalTag('site-settings')] },
  )().then((settings) => settings ?? defaults)
}

export const getSiteSettings = cache(async (locale?: LocaleCode): Promise<SiteSetting> => {
  return fetchSiteSettings(locale)
})

/**
 * Header override fields that follow the "override, else fall back to the
 * translation file" pattern. These MUST be read with locale fallback disabled:
 * with the global `fallback: true`, an empty override in (e.g.) `cz` would
 * resolve to the `en` override value, so the per-locale "empty → use
 * translation" semantics would never trigger and `cz` would wrongly show the
 * English CMS override instead of the Czech `messages/cz.json` value.
 *
 * Note: `headerCtaUrl`, `socialLinks`, `siteName`, meta, etc. intentionally keep
 * fallback (via getSiteSettings) — for those, falling back to the default locale
 * is the desired behaviour.
 */
export type HeaderOverrides = Pick<SiteSetting, 'headerNav' | 'headerCtaText'>

export const getHeaderOverrides = cache(async (locale?: LocaleCode): Promise<HeaderOverrides> => {
  const keyParts = ['global', 'site-settings', 'header-overrides-nofallback', locale ?? '']

  return unstable_cache(
    async (): Promise<HeaderOverrides> => {
      try {
        const payload = await getPayload({ config })
        const settings = await payload.findGlobal({
          slug: 'site-settings',
          depth: 0,
          locale,
          fallbackLocale: 'none',
          overrideAccess: true,
        })
        return { headerNav: settings?.headerNav, headerCtaText: settings?.headerCtaText }
      } catch {
        return { headerNav: undefined, headerCtaText: undefined }
      }
    },
    keyParts,
    { tags: [globalTag('site-settings')] },
  )()
})

export const getEnabledLocales = cache(async (): Promise<LocaleCode[]> => {
  const settings = await getSiteSettings()
  const raw = settings.enabledLocales as string[] | null
  if (!raw || raw.length === 0) return [...localeCodes]
  const valid = raw.filter((code): code is LocaleCode => localeCodes.includes(code as LocaleCode))
  if (valid.length === 0) return [defaultLocale]
  if (!valid.includes(defaultLocale)) return [defaultLocale, ...valid]
  return valid
})
