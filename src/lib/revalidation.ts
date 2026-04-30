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
  /**
   * Paths to revalidate. Supports `{slug}` placeholder for the document's slug,
   * and Next.js dynamic segments like `[locale]` to invalidate every variant
   * of a route (e.g. `/[locale]/blog` invalidates `/blog`, `/lt/blog`, etc.).
   */
  revalidatePaths?: string[]
  /** Revalidate all pages (busts Full Route Cache for entire site). Use for data shown across many pages. */
  revalidateAll?: boolean
}

// `revalidatePath` requires the `'page'` (or `'layout'`) hint when the path
// contains a dynamic segment, otherwise it only invalidates the literal URL.
function revalidateFor(path: string) {
  if (path.includes('[')) {
    revalidatePath(path, 'page')
  } else {
    revalidatePath(path)
  }
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
      revalidatePath('/[locale]', 'layout')
    }

    for (const pathPattern of revalidatePaths) {
      const path = pathPattern.replace('{slug}', doc.slug ?? '')
      revalidateFor(path)
      if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
        const oldPath = pathPattern.replace('{slug}', previousDoc.slug)
        revalidateFor(oldPath)
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
      revalidatePath('/[locale]', 'layout')
    }

    for (const pathPattern of revalidatePaths) {
      const path = pathPattern.replace('{slug}', doc?.slug ?? '')
      revalidateFor(path)
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
      revalidatePath('/[locale]', 'layout')
    }

    for (const path of revalidatePaths) {
      revalidateFor(path)
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
