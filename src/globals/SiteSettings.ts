import type { GlobalConfig } from 'payload'
import { locales } from '@/i18n/locales'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import {
  globalLocaleRestrictedUpdate,
  lockNonLocalizedFieldsForCountryAdmins,
} from '@/lib/access'
import { validateSvgFavicon, validateRasterFaviconSize } from '@/lib/faviconValidation'
import { SVG_MIME } from '@/lib/mimeTypes'

const onlySvg = () => ({ mimeType: { equals: SVG_MIME } })
const onlyRaster = () => ({ mimeType: { not_equals: SVG_MIME } })

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: globalLocaleRestrictedUpdate,
  },
  hooks: {
    afterChange: [
      createGlobalRevalidationHook('site-settings', {
        revalidateAll: true,
        revalidatePaths: ['/sitemap.xml'],
      }),
    ],
  },
  fields: lockNonLocalizedFieldsForCountryAdmins([
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              localized: true,
              defaultValue: 'Jarune',
              admin: {
                description:
                  'Your brand or company name. Appears in browser tabs, search results, and social shares.',
              },
            },
            {
              name: 'siteUrl',
              type: 'text',
              required: true,
              defaultValue: 'http://localhost:3000',
              admin: {
                description:
                  'Your live website address (e.g., https://jarune.com). Used for links in search results and social media.',
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
                description:
                  'Site logo displayed in the header. Recommended: SVG or PNG with transparent background, max height 40px.',
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
          ],
        },
        {
          label: 'Default Meta',
          fields: [
            {
              name: 'defaultMeta',
              type: 'group',
              label: ' ',
              admin: {
                description:
                  "These are fallback values used when a page doesn't have its own SEO settings.",
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                  admin: {
                    description:
                      'Shows in browser tabs and Google results when a page has no title set. Keep it under 60 characters.',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description:
                      'The short summary shown under your site name in Google results. Aim for 150-160 characters. This is used when a page has no description of its own.',
                  },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'images',
                  localized: true,
                  admin: {
                    description:
                      'The image shown when your site is shared on Facebook, Twitter/X, or LinkedIn. Best size: 1200x630 pixels. Used when a page has no image set.',
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
                description:
                  'Your GTM container ID (looks like GTM-XXXXXXX). Find it at tagmanager.google.com. Tracking is automatically disabled in development.',
                placeholder: 'GTM-XXXXXXX',
              },
            },
          ],
        },
        {
          label: 'Favicons',
          fields: [
            {
              name: 'favicons',
              type: 'group',
              label: ' ',
              admin: {
                description:
                  'Browser tab icons, iOS home-screen icon and PWA icons. Upload each at the exact pixel size noted. Any field left empty is simply skipped — browsers will pick the best of whatever is provided.',
              },
              fields: [
                {
                  name: 'svg',
                  type: 'upload',
                  relationTo: 'images',
                  label: 'SVG (any size)',
                  filterOptions: onlySvg,
                  validate: validateSvgFavicon,
                  admin: {
                    description:
                      'Modern browsers prefer this — vector, crisp at every size. Recommended.',
                  },
                },
                {
                  name: 'png16',
                  type: 'upload',
                  relationTo: 'images',
                  label: 'PNG 16×16',
                  filterOptions: onlyRaster,
                  validate: validateRasterFaviconSize(16, 16),
                  admin: {
                    description: 'Browser tab favicon (small). PNG, exactly 16×16 pixels.',
                  },
                },
                {
                  name: 'png32',
                  type: 'upload',
                  relationTo: 'images',
                  label: 'PNG 32×32',
                  filterOptions: onlyRaster,
                  validate: validateRasterFaviconSize(32, 32),
                  admin: {
                    description: 'Browser tab favicon (standard). PNG, exactly 32×32 pixels.',
                  },
                },
                {
                  name: 'apple180',
                  type: 'upload',
                  relationTo: 'images',
                  label: 'Apple Touch Icon 180×180',
                  filterOptions: onlyRaster,
                  validate: validateRasterFaviconSize(180, 180),
                  admin: {
                    description:
                      'Used when iOS users add your site to the home screen. PNG, exactly 180×180 pixels. Should look good on a colored background (no transparency).',
                  },
                },
                {
                  name: 'pwa192',
                  type: 'upload',
                  relationTo: 'images',
                  label: 'PWA Icon 192×192',
                  filterOptions: onlyRaster,
                  validate: validateRasterFaviconSize(192, 192),
                  admin: {
                    description: 'Android home screen / PWA icon. PNG, exactly 192×192 pixels.',
                  },
                },
                {
                  name: 'pwa512',
                  type: 'upload',
                  relationTo: 'images',
                  label: 'PWA Icon 512×512',
                  filterOptions: onlyRaster,
                  validate: validateRasterFaviconSize(512, 512),
                  admin: {
                    description:
                      'PWA splash screen / large icon. PNG, exactly 512×512 pixels.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ]),
}
