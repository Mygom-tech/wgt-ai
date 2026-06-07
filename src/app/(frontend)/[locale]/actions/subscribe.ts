'use server'

import { z } from 'zod'
import { syncToOmnisend, OMNISEND_SOURCE_TAG } from '@/lib/omnisend'

export async function subscribeToNewsletter(
  locale: string,
  email: string,
  omnisendTag?: string,
  honeypot?: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (honeypot) return { success: true }

  const validation = z.string().email().safeParse(email)

  if (!validation.success) {
    return { success: false, error: 'INVALID_EMAIL' }
  }

  const tags = [OMNISEND_SOURCE_TAG.newsletter, omnisendTag].filter((tag): tag is string =>
    Boolean(tag),
  )

  const result = await syncToOmnisend({
    email: validation.data,
    status: 'subscribed',
    tags,
    customProperties: { locale },
  })

  if (!result.success) {
    console.error(`[Newsletter] Omnisend sync failed for ${email}: ${result.error}`)
    return { success: false, error: 'SUBSCRIPTION_FAILED' }
  }

  return { success: true }
}
