import type { GlobalConfig } from 'payload'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { publicRead, superAdminOnly } from '@/lib/access'

export const Newsletter: GlobalConfig = {
  slug: 'newsletter',
  label: 'Newsletter',
  admin: {
    group: 'Content',
  },
  access: {
    read: publicRead,
    update: superAdminOnly,
  },
  hooks: {
    afterChange: [createGlobalRevalidationHook('newsletter', { revalidatePaths: ['/'] })],
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Main heading for the newsletter section, e.g. "Stay in the loop"',
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Supporting text below the heading, e.g. "Get updates on new courses and AI insights"',
      },
    },
    {
      name: 'ctaText',
      type: 'text',
      localized: true,
      defaultValue: 'Subscribe',
      admin: {
        description: 'Button text for the subscribe button',
      },
    },
    {
      name: 'placeholder',
      type: 'text',
      localized: true,
      defaultValue: 'Enter your email',
      admin: {
        description: 'Placeholder text for the email input field',
      },
    },
    {
      name: 'successMessage',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Message shown after a successful subscription',
      },
    },
    {
      name: 'mailerliteGroupId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'MailerLite group ID to add subscribers to. Find it in MailerLite dashboard.',
      },
    },
    {
      name: 'backgroundWord',
      type: 'text',
      defaultValue: 'SUBSCRIBE',
      admin: {
        description: 'Large watermark word displayed in the section background',
      },
    },
    {
      name: 'stickyBar',
      type: 'group',
      admin: {
        description: 'Sticky mobile bar settings',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show a sticky newsletter bar on mobile',
          },
        },
        {
          name: 'text',
          type: 'text',
          localized: true,
          admin: {
            description: 'Short CTA text for the mobile sticky bar, e.g. "Subscribe to updates"',
          },
        },
        {
          name: 'ctaText',
          type: 'text',
          localized: true,
          defaultValue: 'Subscribe',
          admin: {
            description: 'Button text on the sticky bar',
          },
        },
      ],
    },
  ],
}
