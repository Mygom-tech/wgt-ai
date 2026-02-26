'use server'

import { z } from 'zod'
import { syncToMailerLite } from '@/lib/mailerlite'

export async function subscribeToNewsletter(
  locale: string,
  email: string,
  mailerliteGroupId?: string,
  honeypot?: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (honeypot) return { success: true }

  const validation = z.string().email().safeParse(email)

  if (!validation.success) {
    return { success: false, error: 'INVALID_EMAIL' }
  }

  const result = await syncToMailerLite({
    email: validation.data,
    fields: { locale },
    groupId: mailerliteGroupId || undefined,
  })

  if (!result.success) {
    console.error(`[Newsletter] MailerLite sync failed for ${email}: ${result.error}`)
    return { success: false, error: 'SUBSCRIPTION_FAILED' }
  }

  return { success: true }
}
