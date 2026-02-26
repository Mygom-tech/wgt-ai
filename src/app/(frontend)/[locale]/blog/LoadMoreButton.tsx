'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import NextImage from 'next/image'
import { loadMoreBlogPosts } from '../actions/blog'
import type { BlogPost, Image } from '@/payload-types'

function BlogCard({ post, locale }: { post: BlogPost; locale: string }) {
  const image = typeof post.keyVisual === 'object' ? (post.keyVisual as Image) : null
  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article>
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="group block overflow-hidden rounded-sm border border-foreground/[0.08] bg-surface transition-colors hover:border-foreground/[0.15]"
      >
        {image?.url && (
          <div className="aspect-video overflow-hidden">
            <NextImage
              src={image.url}
              alt={image.alt || ''}
              width={image.width ?? 800}
              height={image.height ?? 450}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        <div className="p-6">
          <time className="text-xs uppercase tracking-[0.15em] text-muted" dateTime={post.date}>
            {formattedDate}
          </time>
          <h2 className="mt-2 text-lg font-heading font-medium leading-snug text-foreground">
            {post.title}
          </h2>
        </div>
      </Link>
    </article>
  )
}

export function LoadMoreButton({ locale }: { locale: string }) {
  const t = useTranslations('blog')
  const [page, setPage] = useState(2)
  const [extraPosts, setExtraPosts] = useState<BlogPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    startTransition(async () => {
      const { docs, hasNextPage } = await loadMoreBlogPosts(locale, page)
      setExtraPosts((prev) => [...prev, ...(docs as BlogPost[])])
      setHasMore(hasNextPage ?? false)
      setPage((p) => p + 1)
    })
  }

  return (
    <>
      <div aria-live="polite">
        {extraPosts.length > 0 && (
          <ul className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 list-none p-0" role="list">
            {extraPosts.map((post) => (
              <li key={post.id}>
                <BlogCard post={post} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            aria-busy={isPending}
            className="border border-foreground/[0.08] bg-surface px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.4em] text-foreground transition-colors hover:border-foreground/[0.15] disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px]"
          >
            {isPending ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </>
  )
}
