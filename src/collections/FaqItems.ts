import type { CollectionConfig, Where } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { isSuperAdmin } from '@/lib/access'
import { locales } from '@/i18n/locales'

type UserWithRole = {
  id: string
  role?: string
  assignedLocales?: string[] | null
}

const revalidation = createCollectionRevalidationHooks('faq-items', {
  revalidatePaths: ['/'],
})

export const FaqItems: CollectionConfig = {
  slug: 'faq-items',
  labels: { singular: 'FAQ Item', plural: 'FAQ Items' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'locales', 'sortOrder', 'status'],
    group: 'Content',
    description: 'FAQ items. Each item belongs to specific countries.',
  },
  access: {
    read: ({ req: { user } }): boolean | Where => {
      if (!user) return { status: { equals: 'published' } }
      if (isSuperAdmin(user as UserWithRole)) return true
      const assignedLocales = (user as UserWithRole).assignedLocales
      if (!assignedLocales?.length) return false
      return { locales: { in: assignedLocales } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user as UserWithRole)) return true
      const assignedLocales = (user as UserWithRole).assignedLocales
      if (!assignedLocales?.length) return false
      return { locales: { in: assignedLocales } } satisfies Where
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user as UserWithRole)) return true
      const assignedLocales = (user as UserWithRole).assignedLocales
      if (!assignedLocales?.length) return false
      return { locales: { in: assignedLocales } } satisfies Where
    },
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description: 'Keep questions concise (max 200 characters)',
      },
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
    },
    {
      name: 'locales',
      type: 'select',
      hasMany: true,
      required: true,
      options: locales.map((l) => ({ label: l.label, value: l.code })),
      admin: {
        position: 'sidebar',
        description: 'Which countries this FAQ item belongs to.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers display first',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeChange: [
      // Auto-assign country admin's locales on create if not set
      ({ data, req, operation }) => {
        if (operation === 'create' && data) {
          const user = req.user as UserWithRole | null
          if (user && !isSuperAdmin(user)) {
            const assignedLocales = user.assignedLocales
            if (assignedLocales?.length && (!data.locales || data.locales.length === 0)) {
              data.locales = assignedLocales
            }
          }
        }
        return data
      },
      // Prevent country admins from assigning locales they don't own
      ({ data, req, operation }) => {
        if (!data) return data
        if (operation !== 'create' && operation !== 'update') return data

        const user = req.user as UserWithRole | null
        if (!user || isSuperAdmin(user)) return data

        const assignedLocales = user.assignedLocales
        if (!assignedLocales?.length) {
          throw new Error('You have no assigned locales. Contact a super admin.')
        }

        const itemLocales = data.locales as string[] | undefined
        if (itemLocales?.length) {
          const unauthorized = itemLocales.filter((l) => !assignedLocales.includes(l))
          if (unauthorized.length > 0) {
            throw new Error(
              `You cannot assign locales you don't manage: ${unauthorized.join(', ')}. Your locales: ${assignedLocales.join(', ')}`,
            )
          }
        }

        return data
      },
    ],
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
}
