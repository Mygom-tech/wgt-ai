import type { CollectionConfig } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { adminAccess, enforceLocaleAccess } from '@/lib/access'

// Legal links now render in the site-wide footer (layout), so any change must
// bust the whole route cache, not just the page's own URL. revalidateAll busts
// the root layout, which also covers the legal detail page itself.
const revalidation = createCollectionRevalidationHooks('legal-pages', {
  revalidateAll: true,
})

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
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: {
        description: 'Small label above the page title (accent color). Defaults to "Legal".',
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
    {
      name: 'hideFromFooter',
      type: 'checkbox',
      defaultValue: false,
      label: 'Hide from footer',
      admin: {
        position: 'sidebar',
        description:
          'When checked, this page is not listed in the site footer. The page itself stays live at its URL.',
      },
    },
    {
      name: 'footerOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Order in the footer list. Lower numbers appear first.',
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
