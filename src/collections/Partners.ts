import type { CollectionConfig } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { adminAccess, enforceLocaleAccess } from '@/lib/access'

const revalidation = createCollectionRevalidationHooks('partners', {
  revalidatePaths: ['/'],
})

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'organizationName',
    defaultColumns: ['organizationName', 'country', 'sortOrder', 'status'],
    group: 'Content',
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
      name: 'organizationName',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'images',
      required: true,
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Full URL (e.g. https://google.org). Leave empty if partner has no website.',
      },
    },
    {
      name: 'country',
      type: 'select',
      options: [
        { label: 'Belgium', value: 'BE' },
        { label: 'Bulgaria', value: 'BG' },
        { label: 'Czech Republic', value: 'CZ' },
        { label: 'Denmark', value: 'DK' },
        { label: 'Finland', value: 'FI' },
        { label: 'Latvia', value: 'LV' },
        { label: 'Lithuania', value: 'LT' },
        { label: 'Moldova', value: 'MD' },
        { label: 'Netherlands', value: 'NL' },
        { label: 'Poland', value: 'PL' },
        { label: 'Romania', value: 'RO' },
        { label: 'Sweden', value: 'SE' },
        { label: 'United Kingdom', value: 'GB' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Country of origin (admin metadata only)',
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
      admin: {
        position: 'sidebar',
      },
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
