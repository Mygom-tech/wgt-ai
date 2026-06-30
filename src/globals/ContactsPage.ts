import type { GlobalConfig } from 'payload'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { globalLocaleRestrictedUpdate, prepareGlobalFields } from '@/lib/access'

export const ContactsPage: GlobalConfig = {
  slug: 'contacts-page',
  access: {
    read: () => true,
    update: globalLocaleRestrictedUpdate,
  },
  hooks: {
    afterChange: [
      createGlobalRevalidationHook('contacts-page', { revalidatePaths: ['/contacts'] }),
    ],
  },
  fields: prepareGlobalFields([
    {
      name: 'heading',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Contact Us',
      admin: {
        description: 'Main H1 heading for the contacts page',
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Supporting paragraph below the heading',
      },
    },
    {
      name: 'backgroundWord',
      type: 'text',
      localized: true,
      defaultValue: 'CONTACT',
      admin: {
        description: 'Large decorative watermark word behind the hero section',
      },
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      localized: true,
      admin: {
        description: 'Select which form to display on the contacts page',
      },
    },
    {
      type: 'collapsible',
      label: 'FAQ',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'faq',
          type: 'group',
          label: ' ',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              localized: true,
              defaultValue: 'FAQ',
              admin: {
                description: 'Small label above the FAQ heading',
              },
            },
            {
              name: 'heading',
              type: 'text',
              localized: true,
              required: true,
              defaultValue: 'FAQ',
              admin: {
                description: 'Main heading for the FAQ section',
              },
            },
            {
              name: 'subtitle',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Optional supporting text below the FAQ heading',
              },
            },
            {
              name: 'backgroundWord',
              type: 'text',
              localized: true,
              defaultValue: 'ANSWERS',
              admin: {
                description: 'Large decorative watermark word behind the FAQ section',
              },
            },
          ],
        },
      ],
    },
  ]),
}
