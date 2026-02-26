import type { CollectionConfig, Where } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { isSuperAdmin } from '@/lib/access'
import { locales } from '@/i18n/locales'

const timezoneOptions = Intl.supportedValuesOf('timeZone').map((tz) => {
  const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(2025, 0, 1))
    .find((p) => p.type === 'timeZoneName')?.value ?? ''
  return { label: `${tz.replace(/_/g, ' ')} (${offset})`, value: tz }
})

type UserWithRole = {
  id: string
  role?: string
  assignedLocales?: string[] | null
}

const revalidation = createCollectionRevalidationHooks('events', {
  revalidatePaths: ['/events', '/events/{slug}', '/sitemap.xml'],
})

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'format', 'locales', 'status'],
    group: 'Content',
    description: 'Events and workshops. Each event belongs to specific countries.',
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
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short description for event cards and SEO previews',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'For multi-day events',
      },
    },
    {
      name: 'timeFrom',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'timeOnly', timeFormat: 'HH:mm' },
      },
    },
    {
      name: 'timeTo',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'timeOnly', timeFormat: 'HH:mm' },
      },
    },
    {
      name: 'timeZone',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: timezoneOptions,
    },
    {
      name: 'location',
      type: 'text',
      localized: true,
      admin: {
        description: '"Vilnius, Lithuania" or "Online"',
      },
    },
    {
      name: 'format',
      type: 'select',
      options: [
        { label: 'In Person', value: 'in-person' },
        { label: 'Online', value: 'online' },
        { label: 'Hybrid', value: 'hybrid' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'images',
      hasMany: true,
      required: true,
      admin: {
        description: 'Cover images. First image is used as the primary/hero image.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
    },
    {
      name: 'speakers',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'role',
          type: 'text',
          localized: true,
          admin: { description: 'Job title' },
        },
        {
          name: 'bio',
          type: 'textarea',
          localized: true,
          admin: { description: 'Short bio' },
        },
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'images',
        },
        {
          name: 'socialLinks',
          type: 'array',
          admin: {
            description: 'LinkedIn, website, or other social profiles',
          },
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: [
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'X (Twitter)', value: 'x' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'Website', value: 'website' },
              ],
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: { description: 'Full URL (e.g. https://linkedin.com/in/username)' },
            },
          ],
        },
      ],
    },
    {
      name: 'registrationUrl',
      type: 'text',
      admin: {
        description: 'External registration link (e.g. Eventbrite, Google Form)',
      },
    },
    {
      name: 'registrationForm',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description: 'Optional Payload form for in-house registration',
      },
    },
    {
      name: 'locales',
      type: 'select',
      hasMany: true,
      required: true,
      options: locales.map((l) => ({ label: l.label, value: l.code })),
      admin: {
        position: 'sidebar',
        description: 'Which countries this event belongs to.',
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

        const eventLocales = data.locales as string[] | undefined
        if (eventLocales?.length) {
          const unauthorized = eventLocales.filter((l) => !assignedLocales.includes(l))
          if (unauthorized.length > 0) {
            throw new Error(
              `You cannot assign locales you don't manage: ${unauthorized.join(', ')}. Your locales: ${assignedLocales.join(', ')}`,
            )
          }
        }

        return data
      },
      // Auto-slug from title
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
        }
        return data
      },
    ],
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
}
