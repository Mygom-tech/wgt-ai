import { seoPlugin } from '@payloadcms/plugin-seo'
import type {
  GenerateTitle,
  GenerateDescription,
  GenerateURL,
  GenerateImage,
} from '@payloadcms/plugin-seo/types'
import type { PayloadRequest } from 'payload'
import type { BlogPost, Event, SiteSetting } from '@/payload-types'
import { getSiteUrl } from '@/lib/payload-data'

type SeoDoc = BlogPost | Event

async function getSettingsFromReq(req: PayloadRequest): Promise<SiteSetting> {
  if (!req.context._siteSettings) {
    req.context._siteSettings = await req.payload.findGlobal({ slug: 'site-settings' })
  }
  return req.context._siteSettings as SiteSetting
}

const generateTitle: GenerateTitle<SeoDoc> = async ({ doc, req }) => {
  const settings = await getSettingsFromReq(req)
  const siteName = settings.siteName || 'Jarune'
  return doc?.title ? `${doc.title} | ${siteName}` : siteName
}

const generateDescription: GenerateDescription<SeoDoc> = async ({ doc, req }) => {
  if (doc?.meta?.description) return doc.meta.description
  if ('excerpt' in doc && typeof doc.excerpt === 'string') return doc.excerpt
  const settings = await getSettingsFromReq(req)
  return settings.defaultMeta?.description || ''
}

const generateURL: GenerateURL<SeoDoc> = async ({ doc, req, collectionSlug }) => {
  const settings = await getSettingsFromReq(req)
  const siteUrl = getSiteUrl(settings)
  if (!doc?.slug) return siteUrl
  if (collectionSlug === 'blog-posts') return `${siteUrl}/blog/${doc.slug}`
  if (collectionSlug === 'events') return `${siteUrl}/events/${doc.slug}`
  return `${siteUrl}/${doc.slug}`
}

const generateImage: GenerateImage<SeoDoc> = async ({ doc, req }) => {
  const metaImage = doc?.meta?.image
  if (metaImage) {
    return typeof metaImage === 'object' ? metaImage.id : metaImage
  }
  const keyVisual = 'keyVisual' in doc ? doc.keyVisual : undefined
  if (keyVisual) {
    return typeof keyVisual === 'object' ? keyVisual.id : keyVisual
  }
  const gallery = 'gallery' in doc ? doc.gallery : undefined
  if (Array.isArray(gallery) && gallery.length > 0) {
    const firstImage = gallery[0]
    if (firstImage) {
      return typeof firstImage === 'object' ? firstImage.id : firstImage
    }
  }
  const settings = await getSettingsFromReq(req)
  const defaultImage = settings.defaultMeta?.image
  if (defaultImage) {
    return typeof defaultImage === 'object' ? defaultImage.id : defaultImage
  }
  return undefined as unknown as string
}

export const seoConfig = seoPlugin({
  collections: ['pages', 'blog-posts', 'events'],
  uploadsCollection: 'images',
  tabbedUI: true,
  generateTitle,
  generateDescription,
  generateURL,
  generateImage,
  fields: ({ defaultFields }) => [
    ...defaultFields.filter((field) => !('name' in field && field.name === 'preview')),
    {
      name: 'noIndex',
      type: 'checkbox',
      label: 'Hide from Search Engines',
      defaultValue: false,
      admin: {
        description: 'When checked, this page will NOT appear in Google or other search results. Use this for private pages, thank-you pages, or pages still being worked on.',
      },
    },
    {
      name: 'noFollow',
      type: 'checkbox',
      label: 'Block Link Following',
      defaultValue: false,
      admin: {
        description: 'When checked, search engines will not follow any links on this page. This is rarely needed - only use it if you don\'t want Google to discover other pages through links on this one.',
      },
    },
    {
      name: 'canonicalURL',
      type: 'text',
      label: 'Canonical URL',
      localized: true,
      admin: {
        description: 'Leave this empty in most cases. Only fill this in if this page\'s content also exists at a different URL and you want to tell Google "the other URL is the main one." For example, if you republished a blog post from another site.',
        placeholder: 'https://example.com/original-page',
      },
    },
    {
      name: 'ogType',
      type: 'select',
      label: 'Social Share Type',
      defaultValue: 'website',
      options: [
        { label: 'Website (default)', value: 'website' },
        { label: 'Article (blog posts, news)', value: 'article' },
        { label: 'Product (items for sale)', value: 'product' },
      ],
      admin: {
        description: 'How should this page appear when shared on Facebook or LinkedIn? "Website" works for most pages. Choose "Article" for blog posts or "Product" for shop items.',
      },
    },
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/SeoPreview#SeoPreview',
        },
      },
    },
  ],
})
