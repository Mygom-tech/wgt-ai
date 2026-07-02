import type { GlobalConfig } from 'payload'
import { createGlobalRevalidationHook } from '@/lib/revalidation'
import { globalLocaleRestrictedUpdate, prepareGlobalFields } from '@/lib/access'

export const BlogPage: GlobalConfig = {
  slug: 'blog-page',
  label: 'Blog Page',
  access: {
    read: () => true,
    update: globalLocaleRestrictedUpdate,
  },
  hooks: {
    afterChange: [createGlobalRevalidationHook('blog-page', { revalidatePaths: ['/blog'] })],
  },
  fields: prepareGlobalFields([
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Blog',
      admin: {
        description: 'Small label above the heading',
      },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'News & Updates',
      admin: {
        description: 'Main H1 heading for the blog list page',
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
      defaultValue: 'NEWS',
      admin: {
        description: 'Large decorative watermark word behind the hero section',
      },
    },
    {
      name: 'relatedPostsEyebrow',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Blog post page: label above the Related Posts section. Leave empty to use the built-in translation.',
      },
    },
  ]),
}
