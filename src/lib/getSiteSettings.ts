import { cache } from 'react'
import type { SiteSetting } from '@/payload-types'
import { defaultLocale, localeCodes, type LocaleCode } from '@/i18n/locales'
import { queryGlobal } from './payload-data'

const defaults: SiteSetting = {
  id: '',
  siteName: 'Jarune',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  defaultMeta: {},
  socialLinks: [],
  updatedAt: '',
  createdAt: '',
}

export const getSiteSettings = cache(async (locale?: LocaleCode): Promise<SiteSetting> => {
  const settings = await queryGlobal('site-settings', { locale })
  return settings ?? defaults
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
