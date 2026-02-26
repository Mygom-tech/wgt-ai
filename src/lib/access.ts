import type { Access, FieldAccess } from 'payload'

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
