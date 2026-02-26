'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import NextImage from 'next/image'
import { gsap } from '@/lib/gsap'
import type { Image } from '@/payload-types'

type ImageLightboxProps = {
  images: Image[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  labels: {
    close: string
    previous: string
    next: string
    counter: string
  }
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  labels,
}: ImageLightboxProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const currentImage = images[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  // Lock body scroll
  useEffect(() => {
    document.body.classList.add('lenis-stopped')
    return () => {
      document.body.classList.remove('lenis-stopped')
    }
  }, [])

  // Focus close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Entrance animation
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(backdropRef.current, { opacity: 1 })
      gsap.set(imageRef.current, { opacity: 1, scale: 1 })
      return
    }

    gsap.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
    )
    gsap.fromTo(
      imageRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', delay: 0.05 },
    )
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasPrev) onPrev()
          break
        case 'ArrowRight':
          if (hasNext) onNext()
          break
      }
    },
    [onClose, onPrev, onNext, hasPrev, hasNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Backdrop click closes
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose()
    },
    [onClose],
  )

  if (!currentImage?.url) return null

  const w = currentImage.width ?? 1200
  const h = currentImage.height ?? 800

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 opacity-0"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={labels.counter}
    >
      {/* Close button */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label={labels.close}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Previous button */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label={labels.previous}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label={labels.next}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}

      {/* Image — use fill mode for reliable responsive sizing */}
      <div
        ref={imageRef}
        className="relative opacity-0"
        style={{
          width: '90vw',
          height: '85vh',
          maxWidth: `${w}px`,
          maxHeight: `${h}px`,
        }}
      >
        <NextImage
          src={currentImage.url}
          alt={currentImage.alt || ''}
          fill
          className="object-contain"
          sizes="90vw"
          priority
        />
      </div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
          {labels.counter}
        </div>
      )}
    </div>,
    document.body,
  )
}
