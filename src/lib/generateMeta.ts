import type { Metadata } from 'next'
import type { Article, BreadcrumbList, WithContext } from 'schema-dts'
import type { Image, Page, SiteSetting } from '@/payload-types'
import { localeCodes, defaultLocale, getHtmlLang } from '@/i18n/locales'
import { getSiteUrl } from './payload-data'
import { getTwitterHandle } from './socialUtils'

type MetaDoc = Page

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

interface GeneratePageMetaArgs {
  doc: MetaDoc | null | undefined
  siteSettings: SiteSetting
  collectionSlug?: string
  locale?: string
  enabledLocales?: string[]
}

export function generatePageMeta({
  doc,
  siteSettings,
  collectionSlug,
  locale,
  enabledLocales,
}: GeneratePageMetaArgs): Metadata {
  const siteName = siteSettings.siteName || 'Jarune'
  const siteUrl = getSiteUrl(siteSettings)
  const currentLocale = locale || defaultLocale
  const twitterHandle = getTwitterHandle(siteSettings.socialLinks)

  if (!doc) {
    return {
      title: siteName,
      description: siteSettings.defaultMeta?.description || '',
    }
  }

  const title = doc.meta?.title || doc.title
  const description =
    doc.meta?.description || doc.excerpt || siteSettings.defaultMeta?.description || ''

  const ogImage = resolveMedia(doc.meta?.image) || resolveMedia(siteSettings.defaultMeta?.image)
  const ogImages = ogImage?.url
    ? [{
        url: ogImage.url,
        alt: ogImage.alt,
        width: ogImage.width ?? 1200,
        height: ogImage.height ?? 630,
      }]
    : []

  const slug = doc.slug || ''
  const basePath = collectionSlug ? `/${collectionSlug}/${slug}` : `/${slug}`

  const localePrefix = currentLocale === defaultLocale ? '' : `/${currentLocale}`
  const url = `${siteUrl}${localePrefix}${basePath}`

  const noIndex = doc.meta?.noIndex ?? false
  const noFollow = doc.meta?.noFollow ?? false
  const canonicalURL = doc.meta?.canonicalURL
  const ogType = doc.meta?.ogType || 'website'

  const robots: Metadata['robots'] = {}
  if (noIndex) robots.index = false
  if (noFollow) robots.follow = false

  const languages = buildAlternateLanguages(
    enabledLocales || localeCodes,
    siteUrl,
    basePath,
  )

  const alternateLocales = enabledLocales
    ?.filter((code) => code !== currentLocale)
    .map((code) => getHtmlLang(code))

  const openGraph: Metadata['openGraph'] = {
    title,
    description,
    url,
    siteName,
    images: ogImages,
    type: ogType as 'website' | 'article',
    locale: getHtmlLang(currentLocale),
    ...(alternateLocales?.length ? { alternateLocales } : {}),
  }

  if (ogType === 'article') {
    ;(openGraph as Record<string, unknown>).publishedTime =
      doc.publishedAt || doc.createdAt
    ;(openGraph as Record<string, unknown>).modifiedTime = doc.updatedAt
  }

  return {
    title,
    description,
    openGraph,
    twitter: {
      card: 'summary_large_image',
      site: twitterHandle,
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
    alternates: {
      canonical: canonicalURL || url,
      languages,
    },
    ...(noIndex || noFollow ? { robots } : {}),
  }
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

export function generateArticleJsonLd(
  doc: Page,
  siteUrl: string,
  siteName: string,
  url: string,
): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.meta?.title || doc.title,
    description: doc.meta?.description || doc.excerpt || '',
    url,
    datePublished: doc.publishedAt || doc.createdAt,
    dateModified: doc.updatedAt,
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
  }
}
