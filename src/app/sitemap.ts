import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Image } from '@/payload-types'
import { defaultLocale, getHtmlLang } from '@/i18n/locales'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const payload = await getPayload({ config })

    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const enabledLocales = (settings.enabledLocales as string[] | null) ?? [defaultLocale]

    const pages = await payload.find({
      collection: 'pages',
      where: {
        status: { equals: 'published' },
        'meta.noIndex': { not_equals: true },
      },
      select: {
        slug: true,
        updatedAt: true,
        featuredImage: true,
      },
      limit: 0,
      depth: 1,
    })

    const entries: MetadataRoute.Sitemap = []

    // Homepage entries for each locale
    const homepageLanguages: Record<string, string> = {}
    for (const code of enabledLocales) {
      const prefix = code === defaultLocale ? '' : `/${code}`
      homepageLanguages[getHtmlLang(code)] = `${siteUrl}${prefix}`
    }
    homepageLanguages['x-default'] = siteUrl

    entries.push({
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: homepageLanguages },
    })

    // Page entries
    for (const page of pages.docs) {
      const slug = page.slug
      if (!slug) continue

      const languages: Record<string, string> = {}
      for (const code of enabledLocales) {
        const prefix = code === defaultLocale ? '' : `/${code}`
        languages[getHtmlLang(code)] = `${siteUrl}${prefix}/${slug}`
      }
      languages['x-default'] = `${siteUrl}/${slug}`

      const images: string[] = []
      const featured = page.featuredImage
      if (featured && typeof featured !== 'string' && (featured as Image).url) {
        const imageUrl = (featured as Image).url!
        images.push(imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`)
      }

      entries.push({
        url: `${siteUrl}/${slug}`,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages },
        ...(images.length ? { images } : {}),
      })
    }

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
