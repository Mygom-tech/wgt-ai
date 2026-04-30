import type { GlobalConfig } from 'payload'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { superAdminOnly } from '@/lib/access'

export const EventsPage: GlobalConfig = {
  slug: 'events-page',
  label: 'Events Page',
  access: {
    read: () => true,
    update: superAdminOnly,
  },
  hooks: {
    afterChange: [
      createGlobalRevalidationHook('events-page', { revalidatePaths: ['/[locale]/events'] }),
    ],
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Events',
      admin: {
        description: 'Small label above the heading',
      },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Events & Workshops',
      admin: {
        description: 'Main H1 heading for the events list page',
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
      defaultValue: 'EVENTS',
      admin: {
        description: 'Large decorative watermark word behind the hero section',
      },
    },
  ],
}
