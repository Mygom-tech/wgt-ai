'use client'

import { useState, useCallback } from 'react'
import NextImage from 'next/image'
import { useTranslations } from 'next-intl'
import { ImageLightbox } from '@/components/ImageLightbox'
import type { Image } from '@/payload-types'

type EventGalleryProps = {
  images: Image[]
}

export function EventGallery({ images }: EventGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const t = useTranslations('events')

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
  }, [])

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null && prev < images.length - 1 ? prev + 1 : prev,
    )
  }, [images.length])

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {images.map((img, index) => {
          const thumbUrl = img.sizes?.card?.url || img.url
          const thumbWidth = img.sizes?.card?.width ?? 640
          const thumbHeight = img.sizes?.card?.height ?? 480

          if (!thumbUrl) return null

          return (
            <button
              key={img.id}
              type="button"
              onClick={() => openLightbox(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={img.alt || t('photoSlide', { current: index + 1, total: images.length })}
            >
              <NextImage
                src={thumbUrl}
                alt={img.alt || ''}
                width={thumbWidth}
                height={thumbHeight}
                className="h-full w-full object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {/* Hover overlay with zoom icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
          labels={{
            close: t('closeLightbox'),
            previous: t('previousPhoto'),
            next: t('nextPhoto'),
            counter: t('photoSlide', {
              current: lightboxIndex + 1,
              total: images.length,
            }),
          }}
        />
      )}
    </>
  )
}
