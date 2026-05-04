import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/getSiteSettings'
import { extractFaviconUrls } from '@/lib/getFavicons'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings()
  const favicons = extractFaviconUrls(settings)
  const siteName = settings.siteName || 'Jarune'

  const icons: MetadataRoute.Manifest['icons'] = []
  if (favicons.pwa192) icons.push({ src: favicons.pwa192, sizes: '192x192', type: 'image/png' })
  if (favicons.pwa512) icons.push({ src: favicons.pwa512, sizes: '512x512', type: 'image/png' })

  return {
    name: siteName,
    short_name: siteName,
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons,
  }
}
