import type { GlobalConfig } from 'payload'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { globalLocaleRestrictedUpdate, prepareGlobalFields } from '@/lib/access'

export const EventsPage: GlobalConfig = {
  slug: 'events-page',
  label: 'Events Page',
  access: {
    read: () => true,
    update: globalLocaleRestrictedUpdate,
  },
  hooks: {
    afterChange: [createGlobalRevalidationHook('events-page', { revalidatePaths: ['/events'] })],
  },
  fields: prepareGlobalFields([
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
    {
      name: 'speakersEyebrow',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Event detail page: label above the Speakers section. Leave empty to use the built-in translation.',
      },
    },
    {
      name: 'galleryEyebrow',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Event detail page: label above the Gallery section. Leave empty to use the built-in translation.',
      },
    },
    {
      name: 'registerEyebrow',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Event detail page: label above the registration section. Leave empty to use the built-in translation.',
      },
    },
  ]),
}
