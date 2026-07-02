import type { ServiceResult } from './service-result'

const OMNISEND_API_URL = 'https://api.omnisend.com/v3/contacts'
const OMNISEND_TIMEOUT_MS = 10_000

/**
 * Omnisend email channel subscribe status.
 * - `subscribed`    → on the marketing list (campaigns/automations target them).
 * - `nonSubscribed` → contact saved, but NOT marketing-subscribed (default for new contacts).
 * - `unsubscribed`  → explicitly opted out.
 */
export type OmnisendStatus = 'subscribed' | 'nonSubscribed' | 'unsubscribed'

export const OMNISEND_SOURCE_TAG = {
  form: 'source:form-submission',
  newsletter: 'source:newsletter',
} as const

type ExistingContact = {
  status: OmnisendStatus | null
  tags: string[]
}

/**
 * Omnisend custom-property NAMES allow only letters, digits and underscores (a hyphen or other
 * character → 400 that rejects the whole contact). Form field names are forwarded verbatim as
 * property keys, so sanitise them here — e.g. `privacy-policy` → `privacy_policy`.
 */
function sanitizePropertyKey(key: string): string {
  return key.replace(/[^A-Za-z0-9_]/g, '_')
}

function extractTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((t) => {
      if (typeof t === 'string') return t
      if (t && typeof t === 'object') {
        const obj = t as { tag?: unknown; name?: unknown }

        if (typeof obj.tag === 'string') return obj.tag
        if (typeof obj.name === 'string') return obj.name
      }

      return null
    })
    .filter((t): t is string => Boolean(t))
}

async function fetchContact(apiKey: string, email: string): Promise<ExistingContact | null> {
  const res = await fetch(`${OMNISEND_API_URL}?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-API-KEY': apiKey,
    },
    signal: AbortSignal.timeout(OMNISEND_TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`contact lookup failed (${res.status})`)
  }

  const data = (await res.json().catch(() => null)) as {
    contacts?: Array<{
      tags?: unknown
      identifiers?: Array<{ type?: string; channels?: { email?: { status?: string } } }>
    }>
  } | null

  const contact = data?.contacts?.[0]
  if (!contact) return null

  const status = contact.identifiers?.find((i) => i.type === 'email')?.channels?.email?.status
  return {
    status: (status as OmnisendStatus | undefined) ?? null,
    tags: extractTags(contact.tags),
  }
}

/**
 * Create-or-update an Omnisend contact (upsert by email).
 *
 * Replaces the former MailerLite helper. MailerLite concepts map as:
 *   - groupId → tags (Omnisend has no "groups"; segments are built from tags by marketing).
 *   - fields  → customProperties.
 *   - the subscriber's name → native `firstName`.
 *
 * Omnisend's upsert REPLACES the contact's tag set and requires every email identifier to
 * carry an email channel + status. To preserve history we look the contact up first and
 * (a) merge existing tags with the new ones so no source tag is lost on re-submission, and
 * (b) reuse the existing status for the neutral case so a form never downgrades a subscriber.
 *
 * Mirrors `syncToMailerLite`'s contract: never throws, returns `ServiceResult`.
 */
export async function syncToOmnisend(params: {
  email: string
  status?: OmnisendStatus
  tags?: string[]
  customProperties?: Record<string, string | number | boolean>
  firstName?: string
  lastName?: string
}): Promise<ServiceResult> {
  const apiKey = process.env.OMNISEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'OMNISEND_API_KEY not configured' }
  }

  try {
    let existing: ExistingContact | null = null
    try {
      existing = await fetchContact(apiKey, params.email)
    } catch (lookupError) {
      if (!params.status) {
        return {
          success: false,
          error: `Omnisend sync failed: ${
            lookupError instanceof Error ? lookupError.message : 'lookup failed'
          }`,
        }
      }
    }

    const status = params.status ?? existing?.status ?? 'nonSubscribed'
    const tags = Array.from(new Set([...(existing?.tags ?? []), ...(params.tags ?? [])]))
    const statusChanged = !existing || existing.status !== status
    const emailChannel: Record<string, unknown> = { status }

    if (statusChanged) {
      emailChannel.statusDate = new Date().toISOString()
    }

    const body: Record<string, unknown> = {
      identifiers: [
        {
          type: 'email',
          id: params.email,
          channels: { email: emailChannel },
        },
      ],
    }

    if (params.firstName) {
      body.firstName = params.firstName
    }

    if (params.lastName) {
      body.lastName = params.lastName
    }

    if (tags.length) {
      body.tags = tags
    }

    if (params.customProperties && Object.keys(params.customProperties).length > 0) {
      body.customProperties = Object.fromEntries(
        Object.entries(params.customProperties).map(([key, value]) => [
          sanitizePropertyKey(key),
          value,
        ]),
      )
    }

    const response = await fetch(OMNISEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(OMNISEND_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: `Omnisend API error ${response.status}: ${JSON.stringify(errorData)}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Omnisend sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
