import type { CollectionConfig } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { publicRead, adminAccess } from '@/lib/access'

const revalidation = createCollectionRevalidationHooks('images', { revalidateAll: true })

export const Images: CollectionConfig = {
  slug: 'images',
  labels: {
    singular: 'Image',
    plural: 'Images',
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'mimeType', 'filesize', 'updatedAt'],
    description: 'Upload and manage images. Optimized sizes are generated automatically.',
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
          'Describe the image for screen readers and search engines. Be specific - e.g., "Team meeting in the office" not just "photo".',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Optional visible caption shown below the image on the frontend.',
      },
    },
  ],
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: undefined,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 768,
        height: undefined,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'hero',
        width: 1920,
        height: undefined,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    resizeOptions: {
      withoutEnlargement: true,
    },
    formatOptions: {
      format: 'webp',
      options: { quality: 85 },
    },
    focalPoint: true,
    crop: true,
    adminThumbnail: ({ doc }) => {
      const sizes = doc?.sizes as Record<string, { url?: string | null }> | undefined
      return sizes?.thumbnail?.url || sizes?.card?.url || (doc?.url as string) || ''
    },
    mimeTypes: ['image/*'],
  },
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
}
