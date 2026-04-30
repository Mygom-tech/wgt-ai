import type { CollectionConfig, Where } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { isSuperAdmin } from '@/lib/access'
import { locales } from '@/i18n/locales'

type UserWithRole = {
  id: string
  role?: string
  assignedLocales?: string[] | null
}

const revalidation = createCollectionRevalidationHooks('blog-posts', {
  revalidatePaths: ['/[locale]/blog', '/[locale]/blog/{slug}', '/sitemap.xml'],
})

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: { singular: 'Blog Post', plural: 'Blog Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'locales', 'date', 'status', 'updatedAt'],
    description: 'Blog posts and news articles. Each post belongs to specific countries.',
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
      name: 'keyVisual',
      type: 'upload',
      relationTo: 'images',
      required: true,
      admin: {
        description: 'Recommended: 1200×675px (16:9 ratio). Used as hero image and OG/social preview.',
      },
    },
    {
      name: 'body',
      type: 'richText',
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'blog-posts',
      hasMany: true,
      maxRows: 3,
      filterOptions: ({ id, data }) => {
        const where: Where = {}
        if (id) {
          where.id = { not_equals: id }
        }
        const postLocales = (data as Record<string, unknown>)?.locales as string[] | undefined
        if (postLocales?.length) {
          where.locales = { in: postLocales }
        }
        return where
      },
      admin: {
        description: 'Select up to 3 related posts. Helps SEO via internal linking.',
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
        description: 'Which countries this post belongs to.',
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

        const postLocales = data.locales as string[] | undefined
        if (postLocales?.length) {
          const unauthorized = postLocales.filter((l) => !assignedLocales.includes(l))
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
