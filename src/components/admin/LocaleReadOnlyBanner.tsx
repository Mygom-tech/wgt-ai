'use client'

import React from 'react'
import { useAuth, useLocale } from '@payloadcms/ui'
import { locales } from '@/i18n/locales'
import type { User } from '@/payload-types'

/**
 * Admin guardrail for the locale-restricted globals.
 *
 * Country-admins may only edit a global in a locale they own (see
 * `globalLocaleRestrictedUpdate` in src/lib/access.ts). The Payload admin opens
 * globals in the default locale, which is read-only for them — so the form
 * looks uneditable with no explanation. This banner makes the reason explicit
 * and tells them how to fix it (switch the locale selector).
 *
 * Renders nothing for super-admins or when the selected locale is editable.
 */
const WARNING_STYLE: React.CSSProperties = {
  marginBottom: '1.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  border: '1px solid var(--theme-warning-250, #e6c200)',
  background: 'var(--theme-warning-100, #fff8e1)',
  color: 'var(--theme-warning-800, #5c4d00)',
  fontSize: '0.9rem',
  lineHeight: 1.45,
}

export const LocaleReadOnlyBanner: React.FC = () => {
  const { user } = useAuth<User>()
  const locale = useLocale()

  // Only country-admins hit the read-only-locale trap.
  if (!user || user.role !== 'country-admin') return null

  const assigned = user.assignedLocales ?? []

  // Viewing a locale they own → the form is editable, no warning needed.
  if (assigned.some((code) => code === locale.code)) return null

  if (assigned.length === 0) {
    return (
      <div role="status" style={WARNING_STYLE}>
        ⚠ This content is read-only — you have no assigned locales. Contact a super-admin to get a
        locale assigned to your account.
      </div>
    )
  }

  const assignedLabels = assigned
    .map((code) => locales.find((l) => l.code === code)?.label ?? code)
    .join(', ')

  // useLocale().label may be a localized record; coerce to a readable string.
  const currentLocaleLabel = typeof locale.label === 'string' ? locale.label : locale.code

  return (
    <div role="status" style={WARNING_STYLE}>
      ⚠ You are viewing <strong>{currentLocaleLabel}</strong> in read-only mode. To edit this
      content, switch the locale selector (top-right) to one of your locales:{' '}
      <strong>{assignedLabels}</strong>.
    </div>
  )
}
