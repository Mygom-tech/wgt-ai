'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { MagneticButton } from '@/components/MagneticButton'
import { LogoRow } from '@/components/LogoRow'
import { GridLines } from '@/components/ui/GridLines'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { useFitText } from '@/lib/useFitText'
import type { LandingPage } from '@/payload-types'

type HeroProps = {
  hero: LandingPage['hero']
}

export function Hero({ hero }: HeroProps) {
  const containerRef = useRef<HTMLElement>(null)
  const imageCardRef = useRef<HTMLDivElement>(null)
  const infoCardRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useFitText(textContainerRef, 0.5)

  const [fontsLoaded, setFontsLoaded] = useState(false)

  const t = useTranslations('hero')

  // Data from Payload
  const subtitle =
    hero.subtitle ||
    'Earn a free Google AI Professional Certificate - a practical course on Coursera to help you use AI at work.'
  const ctaText = hero.ctaText || 'Apply Now'
  const eyebrow = hero.eyebrow
  const headingText = hero.heading || 'Technology\nshould work\nfor everyone.'
  const highlightWord = hero.highlightWord || 'everyone'
  const lines = headingText.split(/\\n|\n/)

  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true))
    } else {
      setTimeout(() => setFontsLoaded(true), 100)
    }
  }, [])

  useGSAP(
    () => {
      if (!containerRef.current || !fontsLoaded) return

      const chars = containerRef.current!.querySelectorAll('[data-hero-char]')
      const trustRow = containerRef.current!.querySelector('[data-trust-sidebar]')

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        // Show all elements immediately - CSS opacity-0 needs to be overridden
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(imageCardRef.current, { opacity: 1 })
        gsap.set(infoCardRef.current, { opacity: 1 })
        if (trustRow) gsap.set(trustRow, { opacity: 1 })
        return
      }

      const mm = gsap.matchMedia()

      // ─── Desktop (lg+) ───
      mm.add('(min-width: 1024px)', () => {
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: 'power3.out' },
        })

        // Transform initial states (opacity handled by CSS opacity-0)
        gsap.set(chars, { yPercent: 100, rotateX: -60 })
        gsap.set(imageCardRef.current, { scale: 1.03 })
        gsap.set(infoCardRef.current, { y: 30 })
        if (trustRow) gsap.set(trustRow, { y: 15 })

        // Character cascade - the signature animation
        tl.to(
          chars,
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            stagger: 0.015, // 15ms between each character
            duration: 1.2,
            ease: 'expo.out',
          },
          0,
        )

        // Image reveal - simple opacity + subtle scale settle
        tl.to(
          imageCardRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 1.8,
          },
          0.3,
        )

        // Info card - slides up into place
        tl.to(
          infoCardRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
          },
          0.8,
        )

        // Trust row - last element, gentle entrance
        if (trustRow) {
          tl.to(
            trustRow,
            {
              opacity: 1,
              y: 0,
              duration: 1.2,
            },
            1.2,
          )
        }

        // Continuous Ken Burns - not part of reveal, runs independently
        gsap.to(imageRef.current, {
          scale: 1.1,
          xPercent: 3,
          duration: 25,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        })

        // Trigger - plays when preloader starts exiting
        const isPreloaderDone = document.body.classList.contains('preloader-done')
        if (isPreloaderDone) {
          tl.play()
        } else {
          const handleStartExit = () => tl.play()
          window.addEventListener('preloaderStartExit', handleStartExit)
          return () => window.removeEventListener('preloaderStartExit', handleStartExit)
        }
      })

      // ─── Mobile / Tablet (< lg) ───
      mm.add('(max-width: 1023px)', () => {
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: 'power3.out' },
        })

        // Transform initial states (opacity handled by CSS opacity-0)
        gsap.set(chars, { yPercent: 80, rotateX: -60 })
        gsap.set(imageCardRef.current, { y: 30 })
        gsap.set(infoCardRef.current, { y: 20 })
        if (trustRow) gsap.set(trustRow, { y: 15 })

        // Character cascade
        tl.to(
          chars,
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            stagger: 0.012,
            duration: 1.0,
            ease: 'expo.out',
          },
          0.1,
        )

        // Image - simple fade + slide up
        tl.to(
          imageCardRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
          },
          0.3,
        )

        // Info card
        tl.to(
          infoCardRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
          },
          0.7,
        )

        // Trust row
        if (trustRow) {
          tl.to(
            trustRow,
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
            },
            0.9,
          )
        }

        // Ken Burns for mobile
        gsap.to(imageRef.current, {
          scale: 1.06,
          xPercent: 2,
          duration: 20,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        })

        const isPreloaderDone = document.body.classList.contains('preloader-done')
        if (isPreloaderDone) {
          tl.play()
        } else {
          const handleStartExit = () => tl.play()
          window.addEventListener('preloaderStartExit', handleStartExit)
          return () => window.removeEventListener('preloaderStartExit', handleStartExit)
        }
      })

      return () => mm.revert()
    },
    { scope: containerRef, dependencies: [fontsLoaded] },
  )

  const renderChars = (line: string) => {
    const lowerLine = line.toLowerCase()
    const lowerHighlight = highlightWord.toLowerCase()
    const highlightIndex = lowerLine.indexOf(lowerHighlight)

    return line.split('').map((char, j) => {
      const isHighlight =
        highlightIndex !== -1 && j >= highlightIndex && j < highlightIndex + highlightWord.length
      return (
        <span
          key={j}
          data-hero-char
          className={cn('inline-block origin-top opacity-0', isHighlight && 'text-primary')}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      )
    })
  }

  const heroImage =
    hero.backgroundImage && typeof hero.backgroundImage === 'object' && hero.backgroundImage.url
      ? hero.backgroundImage
      : null

  return (
    <Section
      ref={containerRef}
      aria-labelledby="hero-heading"
      variant="light"
      noPadding
      className="min-h-svh flex flex-col justify-start pt-24 sm:pt-28 md:pt-32 lg:pt-[140px] pb-16 md:pb-20 lg:pb-24"
    >
      <GridLines columns={16} rows={12} className="opacity-60" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-grain mix-blend-multiply"></div>

      <Container size="xl" className="relative z-10 w-full h-full flex flex-col">
        <div className="relative isolate">
          {/* ─── HEADING ─── */}
          <h1
            id="hero-heading"
            ref={textContainerRef}
            style={{ fontSize: 'calc(var(--fit-base) * var(--fit-scale, 1))' }}
            className="relative z-40 flex flex-col mb-6 md:mb-10 lg:mb-14 select-none perspective-2000 pointer-events-none font-heading [--fit-base:clamp(2.25rem,9vw,7.5rem)] md:[--fit-base:clamp(3rem,7vw,7.5rem)] font-medium tracking-[-0.04em] uppercase leading-[0.95]"
          >
            {lines.map((line, i) => (
              <span
                key={i}
                className={cn(
                  'block whitespace-nowrap overflow-hidden pb-1 mb-[0.3vw] md:mb-[0.5vw] lg:mb-[0.6vw]',
                  i === 0 ? 'text-foreground/70' : 'text-foreground',
                )}
              >
                {renderChars(line)}
              </span>
            ))}
          </h1>

          {/* ─── HERO IMAGE ─── */}
          {/* Mobile/Tablet: in-flow stacked block | Desktop: absolute editorial overlap */}
          <div
            className={cn(
              'relative z-30',
              // Mobile: in-flow, full width
              'w-full aspect-[16/10] mb-8',
              // Small tablet
              'sm:aspect-[16/9] sm:mb-10',
              // Large tablet
              'md:aspect-[2/1] md:mb-12',
              // Desktop: absolute positioned overlap - % based so it respects container
              'lg:absolute lg:top-[6vh] lg:right-0 lg:w-[50%] lg:aspect-auto lg:h-[80vh] lg:mb-0 lg:pointer-events-none',
            )}
          >
            <div
              ref={imageCardRef}
              className="relative w-full h-full overflow-hidden bg-neutral-200 rounded-sm lg:rounded-[2px] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] lg:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] opacity-0"
            >
              {heroImage ? (
                <Image
                  ref={imageRef}
                  src={heroImage.url!}
                  alt={heroImage.alt || t('imageAlt')}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                  className="object-cover grayscale-[10%] brightness-[1.02] contrast-[1.05]"
                />
              ) : null}
              {/* Gradient overlay - bottom fade on mobile, left fade on desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white lg:via-transparent lg:to-transparent lg:opacity-50 mix-blend-normal" />
            </div>
          </div>

          {/* ─── INFO CARD ─── */}
          <div
            ref={infoCardRef}
            className="w-full max-w-xl relative z-50 pointer-events-auto opacity-0"
          >
            <div className="flex flex-col gap-6 md:gap-7 lg:gap-8">
              <div className="flex flex-col gap-4 md:gap-5">
                {eyebrow && (
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="w-8 md:w-12 h-[1px] bg-primary"></span>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary">
                      {eyebrow}
                    </span>
                  </div>
                )}
                <p className="text-body-lg font-medium text-foreground/60 leading-relaxed tracking-tight max-w-full lg:max-w-[85%]">
                  {subtitle}
                </p>
              </div>

              <MagneticButton strength={0.06}>
                <a
                  href={hero?.ctaUrl || '#register'}
                  aria-label={ctaText}
                  className="group relative inline-flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3.5 md:py-4 bg-secondary text-foreground hover:text-white rounded-full transition-transform duration-700 hover:scale-[1.03] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] isolate overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-expo -z-10 rounded-full" />
                  <span className="relative z-10 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.25em]">
                    {ctaText}
                  </span>
                  <div className="relative z-10 w-7 md:w-8 h-7 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <svg
                      aria-hidden="true"
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500"
                    >
                      <path
                        d="M1 11L11 1M11 1H1M11 1V11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </a>
              </MagneticButton>

              {/* Partner Logos */}
              {!!hero.trustLogos?.length && (
                <div
                  data-trust-sidebar
                  className="flex flex-col gap-4 pt-4 border-t border-foreground/8 opacity-0"
                >
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-foreground/40">
                    {t('partnersLabel')}
                  </span>
                  <LogoRow logos={hero.trustLogos} variant="dark" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
