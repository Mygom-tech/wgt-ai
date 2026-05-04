import type { SiteSetting, Image as PayloadImage } from '@/payload-types'

export type FaviconRef = {
  url: string
  mimeType: string
}

export type FaviconAssets = {
  svg?: FaviconRef
  png16?: FaviconRef
  png32?: FaviconRef
  apple180?: FaviconRef
  pwa192?: FaviconRef
  pwa512?: FaviconRef
}

function refOf(value: unknown): FaviconRef | undefined {
  if (!value || typeof value !== 'object') return undefined

  const img = value as Partial<PayloadImage>
  if (!img.url || !img.mimeType) return undefined

  return { url: img.url, mimeType: img.mimeType }
}

export function extractFaviconAssets(settings: SiteSetting): FaviconAssets {
  const f = settings.favicons
  if (!f) return {}

  return {
    svg: refOf(f.svg),
    png16: refOf(f.png16),
    png32: refOf(f.png32),
    apple180: refOf(f.apple180),
    pwa192: refOf(f.pwa192),
    pwa512: refOf(f.pwa512),
  }
}
