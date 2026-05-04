import type { SiteSetting, Image as PayloadImage } from '@/payload-types'

export type FaviconUrls = {
  svg?: string
  png16?: string
  png32?: string
  apple180?: string
  pwa192?: string
  pwa512?: string
}

function urlOf(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined

  const img = value as Partial<PayloadImage>
  return img.url ?? undefined
}

export function extractFaviconUrls(settings: SiteSetting): FaviconUrls {
  const f = settings.favicons
  if (!f) return {}

  return {
    svg: urlOf(f.svg),
    png16: urlOf(f.png16),
    png32: urlOf(f.png32),
    apple180: urlOf(f.apple180),
    pwa192: urlOf(f.pwa192),
    pwa512: urlOf(f.pwa512),
  }
}
