import { ImageResponse } from 'next/og'
import { queryBySlug } from '@/lib/payload-data'
import { getSiteSettings } from '@/lib/getSiteSettings'
import { resolveMedia } from '@/lib/generateMeta'
import type { LocaleCode } from '@/i18n/locales'

export const alt = 'Page preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [doc, settings] = await Promise.all([
    queryBySlug('pages', slug, { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
  ])

  // If there's an uploaded OG image, skip generation — Next.js will use the metadata image
  const existingImage = resolveMedia(doc?.meta?.image)
  if (existingImage?.url) {
    // Return a minimal response; the metadata image takes precedence
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', backgroundColor: '#111827' }} />,
      { ...size },
    )
  }

  const title = doc?.meta?.title || doc?.title || 'Jarune'
  const siteName = settings.siteName || 'Jarune'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#111827',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 24,
            maxWidth: '90%',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#9ca3af',
          }}
        >
          {siteName}
        </div>
      </div>
    ),
    { ...size },
  )
}
