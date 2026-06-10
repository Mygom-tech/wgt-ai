'use server'

import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { syncToOmnisend, OMNISEND_SOURCE_TAG } from '@/lib/omnisend'
import { isValidLocale } from '@/i18n/locales'

export async function subscribeToNewsletter(
  locale: string,
  email: string,
  honeypot?: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (honeypot) return { success: true }

  if (!isValidLocale(locale)) {
    return { success: false, error: 'INVALID_LOCALE' }
  }

  const validation = z.string().email().safeParse(email)

  if (!validation.success) {
    return { success: false, error: 'INVALID_EMAIL' }
  }

  const payload = await getPayload({ config })
  const newsletter = await payload.findGlobal({ slug: 'newsletter' })

  const tags = [OMNISEND_SOURCE_TAG.newsletter, newsletter.omnisendTag].filter(
    (tag): tag is string => Boolean(tag),
  )

  const result = await syncToOmnisend({
    email: validation.data,
    status: 'subscribed',
    tags,
    customProperties: { locale },
  })

  if (!result.success) {
    payload.logger.error(
      `[subscribeToNewsletter] Failed to sync newsletter contact to Omnisend. ${result.error}`,
    )
    return { success: false, error: 'SUBSCRIPTION_FAILED' }
  }

  return { success: true }
}
