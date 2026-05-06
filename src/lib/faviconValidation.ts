import type { PayloadRequest } from 'payload'
import { SVG_MIME } from '@/lib/mimeTypes'

type ValidateContext = { req: PayloadRequest }

async function loadImage(value: unknown, req: PayloadRequest) {
  if (value == null) return null
  if (typeof value !== 'string' && typeof value !== 'number') return null

  try {
    const doc = await req.payload.findByID({
      collection: 'images',
      id: value,
      depth: 0,
      req,
      overrideAccess: false,
    })

    return doc as { mimeType?: string | null; width?: number | null; height?: number | null } | null
  } catch {
    return null
  }
}

export const validateSvgFavicon = async (
  value: unknown,
  { req }: ValidateContext,
): Promise<true | string> => {
  if (value == null) return true

  const img = await loadImage(value, req)
  if (!img) return 'Selected image could not be loaded.'

  if (img.mimeType !== SVG_MIME) {
    return `This slot requires an SVG (image/svg+xml). Selected image is ${img.mimeType ?? 'unknown'}.`
  }

  return true
}

export function validateRasterFaviconSize(expectedWidth: number, expectedHeight: number) {
  return async (value: unknown, { req }: ValidateContext): Promise<true | string> => {
    if (value == null) return true

    const img = await loadImage(value, req)
    if (!img) return 'Selected image could not be loaded.'

    if (img.mimeType === SVG_MIME) {
      return `This slot requires a raster image (PNG). SVG is not allowed here.`
    }

    if (img.width !== expectedWidth || img.height !== expectedHeight) {
      return `This slot requires exactly ${expectedWidth}×${expectedHeight} pixels. Selected image is ${img.width ?? '?'}×${img.height ?? '?'}.`
    }

    return true
  }
}
