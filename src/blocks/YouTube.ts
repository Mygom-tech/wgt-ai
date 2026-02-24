import type { Block } from 'payload'

export const YouTubeBlock: Block = {
  slug: 'youtube',
  interfaceName: 'YouTubeBlock',
  labels: {
    singular: 'YouTube Video',
    plural: 'YouTube Videos',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'YouTube Video URL',
      admin: {
        description:
          'Paste a YouTube video link here (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)',
      },
    },
  ],
}
