'use server'

import { queryCollection } from '@/lib/payload-data'
import type { LocaleCode } from '@/i18n/locales'

export async function loadMoreBlogPosts(locale: string, page: number) {
  try {
    const result = await queryCollection('blog-posts', {
      where: {
        status: { equals: 'published' },
        locales: { contains: locale },
      },
      sort: '-date',
      limit: 4,
      page: Math.max(1, page),
      locale: locale as LocaleCode,
      depth: 1,
    })

    return { docs: result.docs, hasNextPage: result.hasNextPage }
  } catch {
    return { docs: [], hasNextPage: false }
  }
}
