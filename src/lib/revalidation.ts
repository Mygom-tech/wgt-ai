import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'
import { collectionTag, documentTag, globalTag } from './payload-data'

// ─── Collection Revalidation Hooks ───────────────────────────────────────────

interface RevalidationHookOptions {
  /** Additional tags to revalidate (e.g., 'pages-sitemap') */
  additionalTags?: string[]
  /** Paths to revalidate (e.g., ['/'] for homepage). Supports `{slug}` placeholder. */
  revalidatePaths?: string[]
  /** Revalidate all pages (busts Full Route Cache for entire site). Use for data shown across many pages. */
  revalidateAll?: boolean
}

export function createCollectionRevalidationHooks(
  collectionSlug: string,
  options: RevalidationHookOptions = {},
) {
  const { additionalTags = [], revalidatePaths = [], revalidateAll = false } = options

  const afterChange: CollectionAfterChangeHook = ({
    doc,
    previousDoc,
    req: { payload, context },
  }) => {
    if (context?.disableRevalidate) return doc

    payload.logger.info(`Revalidating ${collectionSlug} after change`)

    revalidateTag(collectionTag(collectionSlug))

    if (doc.id) revalidateTag(documentTag(collectionSlug, String(doc.id)))
    if (doc.slug) revalidateTag(documentTag(collectionSlug, doc.slug))

    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      revalidateTag(documentTag(collectionSlug, previousDoc.slug))
    }

    for (const tag of additionalTags) {
      revalidateTag(tag)
    }

    if (revalidateAll) {
      revalidatePath('/', 'layout')
    }

    for (const pathPattern of revalidatePaths) {
      const path = pathPattern.replace('{slug}', doc.slug ?? '')
      revalidatePath(path)
      if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
        const oldPath = pathPattern.replace('{slug}', previousDoc.slug)
        revalidatePath(oldPath)
      }
    }

    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({
    doc,
    id,
    req: { payload, context },
  }) => {
    if (context?.disableRevalidate) return doc

    payload.logger.info(`Revalidating ${collectionSlug} after delete`)

    revalidateTag(collectionTag(collectionSlug))
    revalidateTag(documentTag(collectionSlug, String(id)))
    if (doc?.slug) revalidateTag(documentTag(collectionSlug, doc.slug))

    for (const tag of additionalTags) {
      revalidateTag(tag)
    }

    if (revalidateAll) {
      revalidatePath('/', 'layout')
    }

    for (const pathPattern of revalidatePaths) {
      const path = pathPattern.replace('{slug}', doc?.slug ?? '')
      revalidatePath(path)
    }

    return doc
  }

  return { afterChange, afterDelete }
}

// ─── Global Revalidation Hook ────────────────────────────────────────────────

export function createGlobalRevalidationHook(
  globalSlug: string,
  options: { additionalTags?: string[]; revalidatePaths?: string[]; revalidateAll?: boolean } = {},
): GlobalAfterChangeHook {
  const { additionalTags = [], revalidatePaths = [], revalidateAll = false } = options

  return ({ doc, req: { payload, context } }) => {
    if (context?.disableRevalidate) return doc

    payload.logger.info(`Revalidating global: ${globalSlug}`)

    revalidateTag(globalTag(globalSlug))

    for (const tag of additionalTags) {
      revalidateTag(tag)
    }

    if (revalidateAll) {
      revalidatePath('/', 'layout')
    }

    for (const path of revalidatePaths) {
      revalidatePath(path)
    }

    return doc
  }
}

// ─── Manual Revalidation ─────────────────────────────────────────────────────

export function revalidateCollection(slug: string) {
  revalidateTag(collectionTag(slug))
}

export function revalidateDocument(collection: string, idOrSlug: string) {
  revalidateTag(documentTag(collection, idOrSlug))
}

export function revalidateGlobal(slug: string) {
  revalidateTag(globalTag(slug))
}
