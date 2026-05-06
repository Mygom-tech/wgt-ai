import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/getSiteSettings'
import { extractFaviconAssets } from '@/lib/getFavicons'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings()
  const favicons = extractFaviconAssets(settings)
  const siteName = settings.siteName || 'Jarune'

  const icons: MetadataRoute.Manifest['icons'] = []
  if (favicons.pwa192)
    icons.push({ src: favicons.pwa192.url, sizes: '192x192', type: favicons.pwa192.mimeType })
  if (favicons.pwa512)
    icons.push({ src: favicons.pwa512.url, sizes: '512x512', type: favicons.pwa512.mimeType })

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
