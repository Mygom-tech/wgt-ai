import type { BreadcrumbList, WithContext } from 'schema-dts'
import type { Image } from '@/payload-types'
import { defaultLocale, getHtmlLang } from '@/i18n/locales'

export function resolveMedia(value: string | Image | null | undefined): Image | undefined {
  if (!value || typeof value === 'string') return undefined
  return value
}

export function buildAlternateLanguages(
  enabledCodes: readonly string[],
  siteUrl: string,
  basePath: string,
): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const code of enabledCodes) {
    const prefix = code === defaultLocale ? '' : `/${code}`
    languages[getHtmlLang(code)] = `${siteUrl}${prefix}${basePath}`
  }
  languages['x-default'] = `${siteUrl}${basePath}`
  return languages
}

// ─── JSON-LD Generators ─────────────────────────────────────────────────────

export function generateBreadcrumbJsonLd(
  siteName: string,
  siteUrl: string,
  pageTitle: string,
  pagePath: string,
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: siteUrl },
      { '@type': 'ListItem', position: 2, name: pageTitle, item: `${siteUrl}${pagePath}` },
    ],
  }
}
