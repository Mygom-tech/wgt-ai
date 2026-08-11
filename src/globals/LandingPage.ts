import type { GlobalConfig } from 'payload'
import {
  BoldFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { globalLocaleRestrictedUpdate, prepareGlobalFields } from '@/lib/access'

/**
 * Rows are stored per-locale, so adding, removing or reordering them only
 * affects the locale selected in the admin locale picker. Reused by every
 * localized array in the Program tab.
 */
const PER_LOCALE_ROWS_DESCRIPTION =
  'Rows are per-country. Adding, removing or reordering here only affects the language ' +
  'currently selected in the admin locale picker — other countries keep their own rows.'

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  access: {
    read: () => true,
    update: globalLocaleRestrictedUpdate,
  },
  hooks: {
    afterChange: [createGlobalRevalidationHook('landing-page', { revalidatePaths: ['/'] })],
  },
  fields: prepareGlobalFields([
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'heading',
                  type: 'richText',
                  localized: true,
                  required: true,
                  // Deliberately minimal — this is an animated H1, not a content
                  // block. Fully replaces the project-wide editor from
                  // payload.config.ts (no headings, lists, links, uploads or tables).
                  editor: lexicalEditor({
                    features: [
                      ParagraphFeature(),
                      BoldFeature(),
                      ItalicFeature(),
                      UnderlineFeature(),
                      StrikethroughFeature(),
                      FixedToolbarFeature(),
                      InlineToolbarFeature(),
                    ],
                  }),
                  admin: {
                    description:
                      'Main H1. Each paragraph (Enter) renders as one line; Shift+Enter also starts ' +
                      'a new line. BOLD is the exception: it paints the text in the accent color ' +
                      '(teal) rather than making it heavier. Italic, underline and strikethrough ' +
                      'render as you would expect. Lines never wrap, they are scaled down to fit, ' +
                      'so keep each line short.',
                  },
                },
                {
                  name: 'eyebrow',
                  label: 'Eyebrow text',
                  type: 'text',
                  localized: true,
                  admin: {
                    description:
                      'Short label shown between heading and subtitle, e.g. "Strategic Engineering Partner"',
                  },
                },
                {
                  name: 'subtitle',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Supporting text below heading, 1-2 sentences',
                  },
                },
                {
                  name: 'ctaText',
                  type: 'text',
                  localized: true,
                  required: true,
                  defaultValue: 'Apply now',
                  admin: {
                    description: 'Primary CTA button text',
                  },
                },
                {
                  name: 'ctaUrl',
                  type: 'text',
                  localized: true,
                  admin: {
                    description:
                      'Primary CTA button URL, e.g. "#register" or external link like "https://example.com/apply"',
                  },
                },
                {
                  name: 'backgroundImage',
                  type: 'upload',
                  relationTo: 'images',
                  admin: {
                    description:
                      'Optional hero background image. If empty, subtle gradient is used. Recommended: WebP, max 200KB.',
                  },
                },
                {
                  name: 'trustLogos',
                  type: 'array',
                  localized: true,
                  maxRows: 6,
                  labels: {
                    singular: 'Trust Logo',
                    plural: 'Trust Logos',
                  },
                  admin: {
                    description:
                      'Partner logos below CTA, e.g. Google.org, Coursera, EU. Displayed in grayscale.',
                  },
                  fields: [
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'images',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Program',
          fields: [
            {
              type: 'collapsible',
              label: 'Problem',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'problem',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      defaultValue: 'The Challenge',
                      admin: {
                        description: 'Small label above the heading, e.g. "The Challenge"',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      defaultValue: 'The Way We Work Is Changing',
                    },
                    {
                      name: 'body',
                      type: 'richText',
                      localized: true,
                      required: true,
                    },
                    {
                      name: 'ctaText',
                      type: 'text',
                      localized: true,
                      admin: {
                        description: 'Primary CTA button label',
                      },
                    },
                    {
                      name: 'ctaUrl',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Primary CTA button URL, e.g. "#register" or external link like "https://example.com/apply"',
                      },
                    },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'images',
                      admin: {
                        description:
                          'Conceptual image for the problem section. Recommended: WebP, 16:9 or 3:4 aspect ratio.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Skills',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'skills',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Small label above the heading (accent color). Leave empty to use the built-in translation.',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      defaultValue: "Skills You'll Gain",
                    },
                    {
                      name: 'subtitle',
                      type: 'textarea',
                      localized: true,
                    },
                    {
                      name: 'items',
                      type: 'array',
                      localized: true,
                      admin: { description: PER_LOCALE_ROWS_DESCRIPTION },
                      fields: [
                        {
                          name: 'title',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'description',
                          type: 'textarea',
                          required: true,
                        },
                        {
                          name: 'image',
                          type: 'upload',
                          relationTo: 'images',
                        },
                      ],
                    },
                    {
                      name: 'outcomesEyebrow',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Small label above the outcomes/benefits heading (accent color). Leave empty to use the built-in translation.',
                      },
                    },
                    {
                      name: 'benefitsHeading',
                      type: 'text',
                      localized: true,
                      defaultValue: 'What You\u2019ll Achieve',
                      admin: {
                        description: 'Heading for the benefits section at the bottom of Skills',
                      },
                    },
                    {
                      name: 'ctaText',
                      type: 'text',
                      localized: true,
                      admin: {
                        description: 'Primary CTA button label',
                      },
                    },
                    {
                      name: 'ctaUrl',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Primary CTA button URL, e.g. "#register" or external link like "https://example.com/apply"',
                      },
                    },
                    {
                      name: 'benefits',
                      type: 'array',
                      localized: true,
                      maxRows: 3,
                      admin: { description: PER_LOCALE_ROWS_DESCRIPTION },
                      fields: [
                        {
                          name: 'text',
                          type: 'textarea',
                          required: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'How It Works',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'howItWorks',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Small label above the heading (accent color). Leave empty to use the built-in translation.',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      defaultValue: 'How It Works',
                    },
                    {
                      name: 'ctaText',
                      type: 'text',
                      localized: true,
                      admin: {
                        description: 'Primary CTA button label',
                      },
                    },
                    {
                      name: 'ctaUrl',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Primary CTA button URL, e.g. "#register" or external link like "https://example.com/apply"',
                      },
                    },
                    {
                      name: 'steps',
                      type: 'array',
                      localized: true,
                      maxRows: 3,
                      admin: { description: PER_LOCALE_ROWS_DESCRIPTION },
                      fields: [
                        {
                          name: 'title',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'description',
                          type: 'textarea',
                          required: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Audience',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'audience',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Small label above the heading (accent color). Leave empty to use the built-in translation.',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      defaultValue: 'Who Is Invited to Join?',
                    },
                    {
                      name: 'introText',
                      type: 'textarea',
                      localized: true,
                      defaultValue: 'You can apply if you fit into one of these groups:',
                    },
                    {
                      name: 'groups',
                      type: 'array',
                      localized: true,
                      maxRows: 4,
                      admin: { description: PER_LOCALE_ROWS_DESCRIPTION },
                      fields: [
                        {
                          name: 'title',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'description',
                          type: 'textarea',
                          required: true,
                        },
                        {
                          name: 'image',
                          type: 'upload',
                          relationTo: 'images',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Social Proof',
          fields: [
            {
              type: 'collapsible',
              label: 'Testimonials',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'testimonials',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      defaultValue: 'Testimonials',
                      admin: {
                        description: 'Small label above the heading, e.g. "Testimonials"',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      admin: {
                        description: 'Main heading for the testimonials section',
                      },
                    },
                    {
                      name: 'subtitle',
                      type: 'textarea',
                      localized: true,
                      admin: {
                        description: 'Optional supporting text below the heading',
                      },
                    },
                    {
                      name: 'backgroundWord',
                      type: 'text',
                      localized: true,
                      defaultValue: 'VOICES',
                      admin: {
                        description: 'Large decorative watermark word behind the section',
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Partners',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'partners',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      defaultValue: 'Partners',
                      admin: {
                        description: 'Small label above the heading, e.g. "Partners"',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      admin: {
                        description: 'Main heading for the partners section',
                      },
                    },
                    {
                      name: 'subtitle',
                      type: 'textarea',
                      localized: true,
                      admin: {
                        description: 'Optional supporting text below the heading',
                      },
                    },
                    {
                      name: 'backgroundWord',
                      type: 'text',
                      localized: true,
                      defaultValue: 'TRUST',
                      admin: {
                        description: 'Large decorative watermark word behind the section',
                      },
                    },
                    {
                      name: 'visitWebsiteLabel',
                      type: 'text',
                      localized: true,
                      defaultValue: 'Visit website',
                      admin: {
                        description: 'Screen reader text for partner links, e.g. "Visit website"',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Conversion',
          fields: [
            {
              type: 'collapsible',
              label: 'Registration',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'registration',
                  type: 'group',
                  label: ' ',
                  fields: [
                    {
                      name: 'eyebrow',
                      type: 'text',
                      localized: true,
                      admin: {
                        description:
                          'Small label above the heading (accent color). Leave empty to use the built-in translation.',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      admin: {
                        description: 'Main heading for the registration section',
                      },
                    },
                    {
                      name: 'subtitle',
                      type: 'textarea',
                      localized: true,
                      admin: {
                        description: 'Supporting text below the heading',
                      },
                    },
                    {
                      name: 'form',
                      type: 'relationship',
                      relationTo: 'forms',
                      localized: true,
                      admin: {
                        description: 'Select which form to display in this section',
                      },
                    },
                  ],
                },
              ],
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
                        description: 'Small label above the heading, e.g. "FAQ"',
                      },
                    },
                    {
                      name: 'heading',
                      type: 'text',
                      localized: true,
                      required: true,
                      admin: { description: 'Main heading for the FAQ section' },
                    },
                    {
                      name: 'subtitle',
                      type: 'textarea',
                      localized: true,
                      admin: { description: 'Optional supporting text below the heading' },
                    },
                    {
                      name: 'backgroundWord',
                      type: 'text',
                      localized: true,
                      defaultValue: 'ANSWERS',
                      admin: {
                        description: 'Large decorative watermark word behind the section',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Sections',
          name: 'sections',
          admin: {
            description:
              'Ability to enable/disable entire sections of the landing page. This does not delete any content, just hides it from the frontend.',
          },
          fields: [
            {
              name: 'hero',
              type: 'checkbox',
              label: 'Hero',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'problem',
              type: 'checkbox',
              label: 'Problem',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'skills',
              type: 'checkbox',
              label: 'Skills',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'howItWorks',
              type: 'checkbox',
              label: 'How It Works',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'audience',
              type: 'checkbox',
              label: 'Audience',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'registration',
              type: 'checkbox',
              label: 'Registration',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'testimonials',
              type: 'checkbox',
              label: 'Testimonials',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'partners',
              type: 'checkbox',
              label: 'Partners',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'faq',
              type: 'checkbox',
              label: 'FAQ',
              defaultValue: true,
              localized: true,
            },
            {
              name: 'newsletter',
              type: 'checkbox',
              label: 'Newsletter Signup',
              defaultValue: true,
              localized: true,
            },
          ],
        },
      ],
    },
  ]),
}
