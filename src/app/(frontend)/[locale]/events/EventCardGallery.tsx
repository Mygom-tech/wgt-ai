'use client'

import { useState, useCallback, useRef } from 'react'
import NextImage from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Image } from '@/payload-types'

type EventCardGalleryProps = {
  images: Image[]
  title: string
}

export function EventCardGallery({ images, title }: EventCardGalleryProps) {
  const t = useTranslations('events')
  const [currentSlide, setCurrentSlide] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    setCurrentSlide(Math.round(scrollLeft / clientWidth))
  }, [])

  const scrollToSlide = useCallback((i: number) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollRef.current?.scrollTo({
      left: i * (scrollRef.current?.clientWidth ?? 0),
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [])

  if (images.length === 0) return null

  const singleImage = images.length === 1

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t('galleryPhotos', { title })}
      className="relative h-full overflow-hidden"
    >
      <div
        ref={scrollRef}
        className={cn(
          'flex h-full',
          !singleImage && 'snap-x snap-mandatory overflow-x-auto scrollbar-hide',
        )}
        onScroll={!singleImage ? handleScroll : undefined}
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative w-full flex-none snap-center"
            role="group"
            aria-roledescription="slide"
            aria-label={t('photoSlide', { current: i + 1, total: images.length })}
          >
            <NextImage
              src={img.url!}
              alt={img.alt || ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                if (target.parentElement) {
                  target.parentElement.classList.add('bg-muted/20')
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Hover arrows - desktop only, hidden for single image */}
      {!singleImage && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              scrollToSlide(Math.max(0, currentSlide - 1))
            }}
            aria-label={t('previousPhoto')}
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center max-md:hidden"
          >
            &#8249;
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              scrollToSlide(Math.min(images.length - 1, currentSlide + 1))
            }}
            aria-label={t('nextPhoto')}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center max-md:hidden"
          >
            &#8250;
          </button>
        </>
      )}

      {/* Dots for 2-5 images */}
      {images.length > 1 && images.length <= 5 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                i === currentSlide ? 'bg-white' : 'bg-white/50',
              )}
            />
          ))}
        </div>
      )}

      {/* Counter for 6+ images */}
      {images.length > 5 && (
        <span className="absolute bottom-2 right-3 text-xs text-white bg-black/40 px-2 py-0.5 rounded-full">
          {currentSlide + 1} / {images.length}
        </span>
      )}
    </div>
  )
}
