import type { CollectionConfig } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { publicRead, adminAccess } from '@/lib/access'

const revalidation = createCollectionRevalidationHooks('videos', {
  revalidatePaths: ['/', '/blog', '/events'],
})

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: {
    singular: 'Video',
    plural: 'Videos',
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'mimeType', 'filesize', 'updatedAt'],
    description: 'Upload and manage video files.',
  },
  access: {
    read: publicRead,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'Describe the video content for screen readers and search engines. E.g., "Product demo showing the dashboard features".',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Optional visible caption or transcript summary for the video.',
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'images',
      admin: {
        description:
          'Preview image shown before the video plays. Used as the video thumbnail in search results and social shares.',
      },
    },
  ],
  upload: {
    mimeTypes: ['video/*'],
  },
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
}
