import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Image } from '@/payload-types'
import { defaultLocale, getHtmlLang, localeCodes } from '@/i18n/locales'

export const revalidate = 3600

function localeUrl(siteUrl: string, locale: string, path: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  return `${siteUrl}${prefix}${path}`
}

function buildLanguages(
  locales: string[],
  siteUrl: string,
  path: string,
): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const code of locales) {
    languages[getHtmlLang(code)] = localeUrl(siteUrl, code, path)
  }
  if (locales.includes(defaultLocale)) {
    languages['x-default'] = localeUrl(siteUrl, defaultLocale, path)
  }
  return languages
}

function resolveImageUrl(img: unknown, siteUrl: string): string | null {
  if (!img || typeof img === 'string') return null
  const url = (img as Image).url
  if (!url) return null
  return url.startsWith('http') ? url : `${siteUrl}${url}`
}

/** Generate one <url> entry per locale for a given path. */
function perLocaleEntries(
  locales: string[],
  siteUrl: string,
  path: string,
  options: {
    lastModified: Date
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
    images?: string[]
  },
): MetadataRoute.Sitemap {
  const languages = buildLanguages(locales, siteUrl, path)
  return locales.map((locale) => ({
    url: localeUrl(siteUrl, locale, path),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: { languages },
    ...(options.images?.length ? { images: options.images } : {}),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const payload = await getPayload({ config })

    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const enabledLocales = (settings.enabledLocales as string[] | null) ?? [...localeCodes]
    const settingsDate = settings.updatedAt ? new Date(settings.updatedAt as string) : new Date()

    const entries: MetadataRoute.Sitemap = []

    // ─── Homepage ──────────────────────────────────────────────────
    entries.push(
      ...perLocaleEntries(enabledLocales, siteUrl, '', {
        lastModified: settingsDate,
        changeFrequency: 'daily',
        priority: 1.0,
      }),
    )

    // ─── Static pages (all enabled locales) ────────────────────────
    const staticPages = [
      { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
      { path: '/events', changeFrequency: 'weekly' as const, priority: 0.8 },
      { path: '/contacts', changeFrequency: 'monthly' as const, priority: 0.5 },
      { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.5 },
    ]

    for (const page of staticPages) {
      entries.push(
        ...perLocaleEntries(enabledLocales, siteUrl, page.path, {
          lastModified: settingsDate,
          changeFrequency: page.changeFrequency,
          priority: page.priority,
        }),
      )
    }

    // ─── Blog posts ────────────────────────────────────────────────
    const blogPosts = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      select: { slug: true, locales: true, updatedAt: true, keyVisual: true },
      limit: 0,
      depth: 1,
    })

    for (const post of blogPosts.docs) {
      if (!post.slug) continue

      const postLocales = (post.locales as string[] | null) ?? []
      const relevantLocales = enabledLocales.filter((l) => postLocales.includes(l))
      if (relevantLocales.length === 0) continue

      const path = `/blog/${post.slug}`
      const images: string[] = []
      const imgUrl = resolveImageUrl(post.keyVisual, siteUrl)
      if (imgUrl) images.push(imgUrl)

      entries.push(
        ...perLocaleEntries(relevantLocales, siteUrl, path, {
          lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          images,
        }),
      )
    }

    // ─── Events ──────────────────────────────────────────────────
    const eventsResult = await payload.find({
      collection: 'events',
      where: { status: { equals: 'published' } },
      select: { slug: true, locales: true, updatedAt: true, gallery: true },
      limit: 0,
      depth: 1,
    })

    for (const event of eventsResult.docs) {
      if (!event.slug) continue

      const eventLocales = (event.locales as string[] | null) ?? []
      const relevantLocales = enabledLocales.filter((l) => eventLocales.includes(l))
      if (relevantLocales.length === 0) continue

      const path = `/events/${event.slug}`
      const images: string[] = []
      const gallery = (event.gallery as unknown[]) || []
      const firstImg = gallery.find(
        (img): img is Image => typeof img === 'object' && img !== null && !!(img as Image).url,
      )
      const imgUrl = firstImg ? resolveImageUrl(firstImg, siteUrl) : null
      if (imgUrl) images.push(imgUrl)

      entries.push(
        ...perLocaleEntries(relevantLocales, siteUrl, path, {
          lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          images,
        }),
      )
    }

    // Legal pages excluded — they set robots noindex in their metadata

    return entries
  } catch {
    // Build-time fallback when Payload/MongoDB isn't available
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]
  }
}
