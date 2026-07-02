import type { Form } from '@/payload-types'

type FormStep = NonNullable<Form['steps']>[number]
export type FormField = NonNullable<FormStep['fields']>[number]

// Match a form field by its KEY (not position) to Omnisend's native name fields. Normalised
// to ignore case/separators, so `first_name`, `firstName`, `FName` all match.
const FIRST_NAME_KEYS = new Set(['name', 'firstname', 'fname', 'givenname'])
const LAST_NAME_KEYS = new Set(['surname', 'lastname', 'lname', 'familyname'])

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '')

export type ContactFields = {
  firstName?: string
  lastName?: string
  displayName: string
  customProperties: Record<string, string | number | boolean>
}

/**
 * Map a submission to Omnisend contact data: recognised name fields → native first/last name.
 * When `sendAllFields` is true every other field is also forwarded as a custom property keyed
 * by its field name; when false only the names are sent (plus locale/form_source) to minimise
 * personal data shared with Omnisend. `displayName` (for the stored record / emails) falls back
 * to the first text field when no recognised name field exists, so it never regresses.
 *
 * Shared by the live form action and the Omnisend backfill so both map fields identically.
 */
export function buildContactFields(
  fields: FormField[],
  rawData: Record<string, string | boolean>,
  locale: string,
  formSource: string,
  sendAllFields: boolean,
): ContactFields {
  const customProperties: Record<string, string | number | boolean> = {}
  let firstName: string | undefined
  let lastName: string | undefined
  let firstTextFallback = ''

  for (const block of fields) {
    const value = rawData[block.name]
    if (value === undefined || value === '') continue

    if (typeof value === 'string' && block.blockType === 'textField' && !firstTextFallback) {
      firstTextFallback = value
    }

    const key = normalizeKey(block.name)
    if (!firstName && typeof value === 'string' && FIRST_NAME_KEYS.has(key)) {
      firstName = value
      continue
    }
    if (!lastName && typeof value === 'string' && LAST_NAME_KEYS.has(key)) {
      lastName = value
      continue
    }
    if (sendAllFields) {
      customProperties[block.name] = value
    }
  }

  // Reserved keys set last so a form field can't clobber them.
  customProperties.locale = locale
  customProperties.form_source = formSource

  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || firstTextFallback

  return { firstName, lastName, displayName, customProperties }
}
