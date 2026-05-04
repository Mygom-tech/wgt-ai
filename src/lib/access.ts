import type { Access, Field, FieldAccess } from 'payload'

type UserWithRole = {
  id: string
  role?: string
  assignedLocales?: string[] | null
}

// ─── Role Checks ────────────────────────────────────────────────────────────

export function isSuperAdmin(user: UserWithRole | null | undefined): boolean {
  return user?.role === 'super-admin'
}

// ─── Collection Access Helpers ──────────────────────────────────────────────

/** Anyone can read (public frontend needs this) */
export const publicRead: Access = () => true

/** Only authenticated users can read */
export const authenticatedRead: Access = ({ req: { user } }) => !!user

/** Authenticated users can read; super-admins and country-admins can create/update */
export const adminAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  return true
}

/** Only super-admins */
export const superAdminOnly: Access = ({ req: { user } }) => {
  return isSuperAdmin(user as UserWithRole)
}

// ─── Users Collection Access ────────────────────────────────────────────────

/** Super-admins manage all users; country-admins can only read their own profile */
export const usersAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user as UserWithRole)) return true
  return { id: { equals: user.id } }
}

/** Only super-admins can create new users */
export const usersCreateAccess: Access = ({ req: { user } }) => {
  return isSuperAdmin(user as UserWithRole)
}

/** Only super-admins can delete users */
export const usersDeleteAccess: Access = ({ req: { user } }) => {
  return isSuperAdmin(user as UserWithRole)
}

// ─── Field Access ───────────────────────────────────────────────────────────

/** Only super-admins can edit role and assignedLocales fields */
export const superAdminFieldAccess: FieldAccess = ({ req: { user } }) => {
  return isSuperAdmin(user as UserWithRole)
}

// ─── Submissions Access ─────────────────────────────────────────────────────

/** Country-admins see only their locale's submissions; super-admins see all */
export const submissionsByLocale: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user as UserWithRole)) return true
  const locales = (user as UserWithRole).assignedLocales
  if (!locales?.length) return false
  return { locale: { in: locales } }
}

// ─── Globals: locale-restricted update ──────────────────────────────────────

/**
 * Update access for globals.
 *
 * - Super-admins: always allowed.
 * - Country-admins: allowed only when the request's locale is one of their
 *   assignedLocales. Combined with field-level locks on non-localized fields
 *   (see `lockNonLocalizedFieldsForCountryAdmins`), this enforces "country-admins
 *   may only edit localized content within locales they own."
 * - Everyone else: denied.
 */
export const globalLocaleRestrictedUpdate: Access = ({ req: { user, locale } }) => {
  const u = user as UserWithRole | null

  if (!u) return false
  if (isSuperAdmin(u)) return true
  if (u.role !== 'country-admin') return false
  if (!u.assignedLocales?.length) return false
  if (typeof locale !== 'string' || !u.assignedLocales.includes(locale)) return false

  return true
}

// ─── Field Locker for Country-Admins ────────────────────────────────────────

/**
 * Recursively walks a field tree and adds field-level update access denying
 * country-admins on every non-localized field. Localized fields are left alone
 * (their per-locale value is already gated by the doc-level access function).
 *
 * Special case for arrays: if an array has no localized descendants anywhere
 * inside it, country-admin has nothing per-locale to edit, so the entire array
 * is locked (no add/remove/reorder/edit). Otherwise the array's structure
 * stays editable and only inner non-localized fields are locked.
 *
 * Apply to every global's `fields` so country-admins can SEE non-localized
 * fields but the inputs render disabled — they can only edit translations.
 */
export function lockNonLocalizedFieldsForCountryAdmins(fields: Field[]): Field[] {
  return fields.map(processField)
}

/** Walks a field's subtree and returns true if any leaf is `localized: true`. */
function hasLocalizedDescendant(field: Field): boolean {
  if (field.type === 'ui') return false
  if (field.type === 'tabs') {
    return field.tabs.some((tab) => tab.fields.some(hasLocalizedDescendant))
  }
  if (field.type === 'collapsible' || field.type === 'row') {
    return field.fields.some(hasLocalizedDescendant)
  }
  if (field.type === 'group' || field.type === 'array') {
    if ('localized' in field && field.localized) return true

    return (field.fields ?? []).some(hasLocalizedDescendant)
  }
  if (field.type === 'blocks') {
    if ('localized' in field && field.localized) return true

    return field.blocks.some((block) => block.fields.some(hasLocalizedDescendant))
  }

  return 'localized' in field && Boolean(field.localized)
}

function processField(field: Field): Field {
  // Pure UI / no-data fields
  if (field.type === 'ui') return field

  // Tabs container: recurse into each tab's fields
  if (field.type === 'tabs') {
    return {
      ...field,
      tabs: field.tabs.map((tab) => ({
        ...tab,
        fields: lockNonLocalizedFieldsForCountryAdmins(tab.fields),
      })),
    }
  }

  // Pure layout containers: recurse without considering localization
  if (field.type === 'collapsible' || field.type === 'row') {
    return {
      ...field,
      fields: lockNonLocalizedFieldsForCountryAdmins(field.fields),
    }
  }

  // Data containers
  if (field.type === 'group' || field.type === 'array') {
    // If the container itself is localized, every value inside is per-locale —
    // country-admins can edit it (subject to the doc-level locale check).
    if ('localized' in field && field.localized) return field

    // Special case for arrays with zero localized descendants: lock the whole
    // array. Country-admin has nothing per-locale to edit inside it, so add /
    // remove / reorder would be purely structural — and structural changes to
    // a non-localized array affect every locale.
    if (field.type === 'array' && !hasLocalizedDescendant(field)) {
      const existingAccess = 'access' in field ? field.access : undefined

      return {
        ...field,
        access: {
          ...existingAccess,
          update: superAdminFieldAccess,
        },
      } as Field
    }

    return {
      ...field,
      fields: lockNonLocalizedFieldsForCountryAdmins(field.fields),
    }
  }

  if (field.type === 'blocks') {
    if ('localized' in field && field.localized) return field

    return {
      ...field,
      blocks: field.blocks.map((block) => ({
        ...block,
        fields: lockNonLocalizedFieldsForCountryAdmins(block.fields),
      })),
    }
  }

  // Leaf field. If localized, leave it editable. Otherwise lock update for
  // anyone other than super-admins.
  if ('localized' in field && field.localized) return field

  const existingAccess = 'access' in field ? field.access : undefined

  return {
    ...field,
    access: {
      ...existingAccess,
      update: superAdminFieldAccess,
    },
  } as Field
}

// ─── Locale Validation Hook ─────────────────────────────────────────────────

export function enforceLocaleAccess({
  req,
  operation,
}: {
  req: { user?: UserWithRole | null; locale?: string }
  operation: 'create' | 'update'
}) {
  const user = req.user as UserWithRole | null
  if (!user) return
  if (isSuperAdmin(user)) return

  // Only enforce on updates - creation uses default locale
  if (operation !== 'update') return

  const locale = req.locale
  if (!locale) return

  const assignedLocales = user.assignedLocales
  if (!assignedLocales || assignedLocales.length === 0) {
    throw new Error('You have no assigned locales. Contact a super admin.')
  }

  if (!assignedLocales.includes(locale)) {
    throw new Error(
      `You do not have permission to edit content in "${locale}". Your assigned locales: ${assignedLocales.join(', ')}`,
    )
  }
}
