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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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

export const getEnabledLocales = cache(async (): Promise<LocaleCode[]> => {
  const settings = await getSiteSettings()
  const raw = settings.enabledLocales as string[] | null
  if (!raw || raw.length === 0) return [defaultLocale]
  const valid = raw.filter((code): code is LocaleCode =>
    localeCodes.includes(code as LocaleCode),
  )
  if (valid.length === 0) return [defaultLocale]
  if (!valid.includes(defaultLocale)) return [defaultLocale, ...valid]
  return valid
})
