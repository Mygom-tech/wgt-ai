'use client'

import { useRef, useState, useEffect } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { AddToCalendarDropdown } from '../AddToCalendarDropdown'
import { gsap, useGSAP } from '@/lib/gsap'
import type { Event, Image } from '@/payload-types'

type EventHeroProps = {
  title: string
  eyebrow: string | undefined
  heroImage: Image | null
  formattedDate: string
  formattedTime: string | null
  location: string | null | undefined
  format: string | null | undefined
  locale: string
  event: Event
  isPast?: boolean
}

const formatTranslationKeys: Record<string, 'inPerson' | 'online' | 'hybrid'> = {
  'in-person': 'inPerson',
  online: 'online',
  hybrid: 'hybrid',
}

export function EventHero({
  title,
  eyebrow,
  heroImage,
  formattedDate,
  formattedTime,
  location,
  format,
  locale,
  event,
  isPast = false,
}: EventHeroProps) {
  const containerRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const infoStripRef = useRef<HTMLDivElement>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const t = useTranslations('events')

  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true))
    } else {
      setTimeout(() => setFontsLoaded(true), 100)
    }
  }, [])

  // Signal to the Header that it's over a dark hero
  useEffect(() => {
    document.body.classList.add('dark-hero')
    return () => document.body.classList.remove('dark-hero')
  }, [])

  useGSAP(
    () => {
      if (!containerRef.current || !fontsLoaded) return

      const chars = containerRef.current.querySelectorAll('[data-event-char]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(infoStripRef.current, { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      // Character cascade on title
      gsap.set(chars, { yPercent: 100, rotateX: -60 })
      gsap.set(infoStripRef.current, { y: 30 })

      tl.to(
        chars,
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          stagger: 0.015,
          duration: 1.2,
          ease: 'expo.out',
        },
        0,
      )

      // Info strip slide up
      tl.to(
        infoStripRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
        },
        0.6,
      )

      // Ken Burns on hero image
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          scale: 1.06,
          xPercent: 2,
          duration: 20,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        })
      }
    },
    { scope: containerRef, dependencies: [fontsLoaded] },
  )

  const renderChars = (text: string) =>
    text.split(' ').map((word, wi) => (
      <span key={wi} className="inline-block whitespace-nowrap">
        {word.split('').map((char, ci) => (
          <span key={ci} data-event-char className="inline-block origin-top opacity-0">
            {char}
          </span>
        ))}
        {wi < text.split(' ').length - 1 && (
          <span data-event-char className="inline-block origin-top opacity-0">
            {'\u00A0'}
          </span>
        )}
      </span>
    ))

  return (
    <Section
      ref={containerRef}
      variant="dark"
      noPadding
      className="relative min-h-[70vh] lg:min-h-[80vh] flex flex-col justify-end"
    >
      {/* Hero image — full-bleed */}
      {heroImage?.url && (
        <div className="absolute inset-0 z-0">
          <NextImage
            ref={imageRef}
            src={heroImage.url}
            alt={heroImage.alt || title}
            fill
            sizes="100vw"
            priority
            className="object-cover grayscale-[10%]"
          />
          {/* Top gradient — header readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
          {/* Bottom gradient — title + info strip readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent" />
        </div>
      )}

      {/* Back link — below fixed header */}
      <div className="absolute top-20 left-0 right-0 z-20">
        <Container size="xl">
          <Link
            href={`/${locale}/events`}
            className="inline-flex items-center text-sm text-white/60 transition-colors hover:text-white"
          >
            {t('backToEvents')}
          </Link>
        </Container>
      </div>

      {/* Title + info strip */}
      <div className="relative z-10 pb-10 pt-40 sm:pt-48 md:pt-56">
        <Container size="xl">
          {eyebrow && (
            <div className="mb-4">
              <Eyebrow label={eyebrow} color="white" />
            </div>
          )}

          <h1
            className="font-heading font-medium uppercase tracking-[-0.02em] leading-[1.05] perspective-2000 select-none max-w-[50rem] text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            <span className="block whitespace-normal heading-reveal-mask pb-1">
              {renderChars(title)}
            </span>
          </h1>

          {/* Info strip — glass card */}
          <div
            ref={infoStripRef}
            className="mt-8 bg-white/[0.08] backdrop-blur-sm rounded-[2px] px-5 py-4 sm:px-6 sm:py-4 opacity-0"
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/80">
              <time dateTime={event.date} className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/50"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formattedDate}
              </time>

              {formattedTime && (
                <>
                  <span className="hidden sm:block w-px h-4 bg-white/20" aria-hidden="true" />
                  <span className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/50"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formattedTime}
                  </span>
                </>
              )}

              {location && (
                <>
                  <span className="hidden sm:block w-px h-4 bg-white/20" aria-hidden="true" />
                  <span className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/50"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {location}
                  </span>
                </>
              )}

              {format && (
                <>
                  <span className="hidden sm:block w-px h-4 bg-white/20" aria-hidden="true" />
                  <span className="inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] rounded-[2px] bg-white/10 text-white/90">
                    {t(formatTranslationKeys[format] || 'inPerson')}
                  </span>
                </>
              )}

              {/* Spacer pushes action to right on larger screens */}
              <span className="hidden lg:block flex-1" aria-hidden="true" />

              {isPast ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] rounded-full bg-white/10 text-white/70">
                  <svg
                    aria-hidden="true"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {t('pastEvent')}
                </span>
              ) : (
                <AddToCalendarDropdown event={event} />
              )}
            </div>
          </div>
        </Container>
      </div>
    </Section>
  )
}
