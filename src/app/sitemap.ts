import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Image } from '@/payload-types'
import { defaultLocale, getHtmlLang, localeCodes } from '@/i18n/locales'

export const revalidate = 3600

function buildLanguages(
  enabledLocales: string[],
  siteUrl: string,
  path: string,
): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const code of enabledLocales) {
    const prefix = code === defaultLocale ? '' : `/${code}`
    languages[getHtmlLang(code)] = `${siteUrl}${prefix}${path}`
  }
  languages['x-default'] = `${siteUrl}${path}`
  return languages
}

function buildLocaleFilteredLanguages(
  relevantLocales: string[],
  siteUrl: string,
  path: string,
): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const code of relevantLocales) {
    const prefix = code === defaultLocale ? '' : `/${code}`
    languages[getHtmlLang(code)] = `${siteUrl}${prefix}${path}`
  }
  if (relevantLocales.includes(defaultLocale)) {
    languages['x-default'] = `${siteUrl}${path}`
  }
  return languages
}

function resolveImageUrl(img: unknown, siteUrl: string): string | null {
  if (!img || typeof img === 'string') return null
  const url = (img as Image).url
  if (!url) return null
  return url.startsWith('http') ? url : `${siteUrl}${url}`
}

/** Build the canonical URL for locale-filtered content (blogs, events).
 *  Uses the unprefixed URL when the default locale is available,
 *  otherwise falls back to the first available locale's prefixed URL. */
function buildCanonicalUrl(relevantLocales: string[], siteUrl: string, path: string): string {
  if (relevantLocales.includes(defaultLocale)) {
    return `${siteUrl}${path}`
  }
  return `${siteUrl}/${relevantLocales[0]}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const payload = await getPayload({ config })

    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const enabledLocales = (settings.enabledLocales as string[] | null) ?? [...localeCodes]

    const entries: MetadataRoute.Sitemap = []

    // ─── Homepage ──────────────────────────────────────────────────
    entries.push({
      url: siteUrl,
      lastModified: settings.updatedAt ? new Date(settings.updatedAt as string) : new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: buildLanguages(enabledLocales, siteUrl, '') },
    })

    // ─── Static pages (all enabled locales) ────────────────────────
    const staticPages = [
      { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
      { path: '/events', changeFrequency: 'weekly' as const, priority: 0.8 },
      { path: '/contacts', changeFrequency: 'monthly' as const, priority: 0.5 },
      { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.5 },
    ]

    for (const page of staticPages) {
      entries.push({
        url: `${siteUrl}${page.path}`,
        lastModified: settings.updatedAt ? new Date(settings.updatedAt as string) : new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: buildLanguages(enabledLocales, siteUrl, page.path) },
      })
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

      entries.push({
        url: buildCanonicalUrl(relevantLocales, siteUrl, path),
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: buildLocaleFilteredLanguages(relevantLocales, siteUrl, path) },
        ...(images.length ? { images } : {}),
      })
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

      entries.push({
        url: buildCanonicalUrl(relevantLocales, siteUrl, path),
        lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: buildLocaleFilteredLanguages(relevantLocales, siteUrl, path) },
        ...(images.length ? { images } : {}),
      })
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
