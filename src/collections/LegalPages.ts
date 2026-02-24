import type { CollectionConfig } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { adminAccess, enforceLocaleAccess } from '@/lib/access'

const revalidation = createCollectionRevalidationHooks('legal-pages')

export const LegalPages: CollectionConfig = {
  slug: 'legal-pages',
  labels: { singular: 'Legal Page', plural: 'Legal Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'pageType', 'status', 'updatedAt'],
    description: 'Legal documents: Cookie Policy, Terms and Conditions, Privacy Policy.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
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
      name: 'pageType',
      type: 'select',
      required: true,
      options: [
        { label: 'Cookie Policy', value: 'cookie-policy' },
        { label: 'Terms and Conditions', value: 'terms-and-conditions' },
        { label: 'Privacy Policy', value: 'privacy-policy' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
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
      ({ req, operation }) => enforceLocaleAccess({ req, operation }),
    ],
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
}
