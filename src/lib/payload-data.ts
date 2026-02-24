import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { CollectionSlug, GlobalSlug, Where, PaginatedDocs } from 'payload'
import type { Config, SiteSetting } from '@/payload-types'

type TypedLocale = Config['locale']

// ─── Tag Utilities ───────────────────────────────────────────────────────────

export function collectionTag(slug: string): string {
  return slug
}

export function documentTag(collection: string, idOrSlug: string): string {
  return `${collection}:${idOrSlug}`
}

export function globalTag(slug: string): string {
  return `global:${slug}`
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

export function getSiteUrl(settings?: Pick<SiteSetting, 'siteUrl'> | null): string {
  return settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

async function getPayloadSafe() {
  try {
    return await getPayload({ config })
  } catch {
    return null
  }
}

// ─── Shared Options ──────────────────────────────────────────────────────────

interface QueryOptions {
  depth?: number
  locale?: TypedLocale
  draft?: boolean
}

interface QueryCollectionOptions extends QueryOptions {
  where?: Where
  sort?: string
  limit?: number
  page?: number
}

// ─── Collection Queries ──────────────────────────────────────────────────────

export async function queryCollection<TSlug extends CollectionSlug>(
  collection: TSlug,
  options: QueryCollectionOptions = {},
) {
  const { where, sort, limit, page, depth = 1, locale, draft } = options

  const keyParts = [
    'collection',
    collection,
    JSON.stringify(where ?? {}),
    sort ?? '',
    String(limit ?? ''),
    String(page ?? ''),
    String(depth),
    locale ?? '',
    String(draft ?? false),
  ]

  return unstable_cache(
    async () => {
      const payload = await getPayloadSafe()
      if (!payload) {
        return {
          docs: [],
          totalDocs: 0,
          totalPages: 0,
          page: 1,
          limit: limit ?? 10,
          hasNextPage: false,
          hasPrevPage: false,
          pagingCounter: 1,
          prevPage: null,
          nextPage: null,
        } as PaginatedDocs<never>
      }
      return payload.find({
        collection,
        where,
        sort,
        limit,
        page,
        depth,
        locale,
        draft,
        overrideAccess: false,
      })
    },
    keyParts,
    { tags: [collectionTag(collection)] },
  )()
}

export async function queryBySlug<TSlug extends CollectionSlug>(
  collection: TSlug,
  slug: string,
  options: QueryOptions = {},
) {
  const { depth = 1, locale, draft } = options

  const keyParts = [
    'bySlug',
    collection,
    slug,
    String(depth),
    locale ?? '',
    String(draft ?? false),
  ]

  return unstable_cache(
    async () => {
      const payload = await getPayloadSafe()
      if (!payload) return null
      const result = await payload.find({
        collection,
        where: { slug: { equals: slug } },
        limit: 1,
        depth,
        locale,
        draft,
        overrideAccess: false,
      })
      return result.docs[0] ?? null
    },
    keyParts,
    { tags: [collectionTag(collection), documentTag(collection, slug)] },
  )()
}

export async function queryById<TSlug extends CollectionSlug>(
  collection: TSlug,
  id: string,
  options: QueryOptions = {},
) {
  const { depth = 1, locale, draft } = options

  const keyParts = [
    'byId',
    collection,
    id,
    String(depth),
    locale ?? '',
    String(draft ?? false),
  ]

  return unstable_cache(
    async () => {
      const payload = await getPayloadSafe()
      if (!payload) return null
      try {
        return await payload.findByID({
          collection,
          id,
          depth,
          locale,
          draft,
          overrideAccess: false,
        })
      } catch {
        return null
      }
    },
    keyParts,
    { tags: [collectionTag(collection), documentTag(collection, id)] },
  )()
}

// ─── Global Queries ──────────────────────────────────────────────────────────

export async function queryGlobal<TSlug extends GlobalSlug>(
  slug: TSlug,
  options: QueryOptions = {},
) {
  const { depth = 1, locale, draft } = options

  const keyParts = [
    'global',
    slug,
    String(depth),
    locale ?? '',
    String(draft ?? false),
  ]

  return unstable_cache(
    async () => {
      const payload = await getPayloadSafe()
      if (!payload) return null
      return payload.findGlobal({
        slug,
        depth,
        locale,
        draft,
        overrideAccess: false,
      })
    },
    keyParts,
    { tags: [globalTag(slug)] },
  )()
}
