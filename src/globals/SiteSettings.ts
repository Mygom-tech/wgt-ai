import type { GlobalConfig } from 'payload'
import { locales } from '@/i18n/locales'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { superAdminOnly } from '@/lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: superAdminOnly,
  },
  hooks: {
    afterChange: [createGlobalRevalidationHook('site-settings')],
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Jarune',
      admin: {
        description: 'Your brand or company name. Appears in browser tabs, search results, and social shares.',
      },
    },
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      defaultValue: 'http://localhost:3000',
      admin: {
        description: 'Your live website address (e.g., https://jarune.com). Used for links in search results and social media.',
      },
    },
    {
      name: 'enabledLocales',
      type: 'select',
      hasMany: true,
      defaultValue: ['en'],
      options: locales.map((l) => ({ label: l.label, value: l.code })),
      admin: {
        description:
          'Choose which languages are available on your website. English is always included.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'images',
      admin: {
        description: 'Site logo displayed in the header. Recommended: SVG or PNG with transparent background, max height 40px.',
      },
    },
    {
      name: 'headerCtaText',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional override for the header CTA button text. Leave empty to use the default translation for each language.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Default Meta',
          fields: [
            {
              name: 'defaultMeta',
              type: 'group',
              label: ' ',
              admin: {
                description: 'These are fallback values used when a page doesn\'t have its own SEO settings.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'Shows in browser tabs and Google results when a page has no title set. Keep it under 60 characters.',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'The short summary shown under your site name in Google results. Aim for 150-160 characters. This is used when a page has no description of its own.',
                  },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'images',
                  localized: true,
                  admin: {
                    description: 'The image shown when your site is shared on Facebook, Twitter/X, or LinkedIn. Best size: 1200x630 pixels. Used when a page has no image set.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Social Links',
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              label: 'Social Links',
              labels: {
                singular: 'Social Link',
                plural: 'Social Links',
              },
              admin: {
                description:
                  'Add your social media profiles. These will appear in the website footer.',
              },
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'X (Twitter)', value: 'x' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'Pinterest', value: 'pinterest' },
                    { label: 'GitHub', value: 'github' },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  admin: {
                    placeholder: 'https://...',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'supportEmail',
              type: 'email',
              admin: {
                description: 'General support email displayed in the footer.',
                placeholder: 'support@jarune.com',
              },
            },
            {
              name: 'partnershipEmail',
              type: 'email',
              admin: {
                description: 'Partnership inquiry email displayed in the footer.',
                placeholder: 'partners@jarune.com',
              },
            },
            {
              name: 'footerText',
              type: 'text',
              localized: true,
              admin: {
                description: 'Copyright text at the bottom of every page.',
              },
            },
          ],
        },
        {
          label: 'Tracking',
          fields: [
            {
              name: 'gtmId',
              type: 'text',
              label: 'Google Tag Manager ID',
              admin: {
                description: 'Your GTM container ID (looks like GTM-XXXXXXX). Find it at tagmanager.google.com. Tracking is automatically disabled in development.',
                placeholder: 'GTM-XXXXXXX',
              },
            },
          ],
        },
      ],
    },
  ],
}
