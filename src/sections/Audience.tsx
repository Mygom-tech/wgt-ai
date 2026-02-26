'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { gsap, useGSAP } from '@/lib/gsap'
import type { LandingPage, Image as PayloadImage } from '@/payload-types'

type AudienceProps = {
  audience: LandingPage['audience']
}

export function Audience({ audience }: AudienceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('audience')

  const heading = audience.heading
  const introText = audience.introText
  const groups = audience.groups ?? []

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-aud-char]')
      const cards = sectionRef.current.querySelectorAll('[data-aud-card]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(cards, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%', // Trigger when header is 85% visible
        },
      })

      // Character cascade - starts immediately
      if (chars.length) {
        tl.from(chars, {
          yPercent: 100,   // Characters start 100% below baseline
          rotateX: -60,    // Characters rotate in from behind
          opacity: 0,
          stagger: 0.015,  // 15ms between each character
          duration: 1.2,
          ease: 'expo.out',
        }, 0)
      }

      // Card reveal - curtain wipe with slight zoom (fromTo needed for clipPath)
      if (cards.length) {
        tl.fromTo(cards,
          { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.05 }, // Hidden: clipped from bottom, slightly enlarged
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            stagger: 0.12,
            duration: 1.2,
            ease: 'power4.inOut',
          },
          0.3,                 // 300ms offset from character animation start
        )
      }
    },
    { scope: sectionRef },
  )

  return (
    <Section ref={sectionRef} id="audience" aria-labelledby="audience-heading" variant="light">
      <GridLines columns={16} rows={12} className="opacity-40" />

      {/* Background watermark - sits at top of cards, bottom half covered */}
      <div
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none select-none z-0"
        aria-hidden="true"
        data-nosnippet
      >
        <span className="text-[clamp(8rem,20vw,24rem)] font-black uppercase text-foreground/[0.04] tracking-[-0.05em] leading-none">
          {t('backgroundWord')}
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        {/* ─── Header ─── */}
        <header
          ref={headerRef}
          className="flex flex-col gap-6 lg:gap-8 mb-10 lg:mb-14"
        >
          <Eyebrow label={t('eyebrow')} />

          <h2 id="audience-heading" className="text-[clamp(2.5rem,6vw,7.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading flex flex-wrap gap-x-[0.2em] perspective-2000">
            {heading.split(' ').map((word, i) => (
              <span key={i} className="overflow-hidden inline-flex gap-[0.1em] pb-1">
                {word.split('').map((char, j) => (
                  <span key={j} data-aud-char className="inline-block origin-top">
                    {char}
                  </span>
                ))}
                <span className="inline-block">&nbsp;</span>
              </span>
            ))}
          </h2>

          {introText && (
            <>
              <hr className="w-full h-[1px] bg-foreground/10 border-none" />
              <p className="text-body-lg font-medium text-foreground/60 leading-relaxed tracking-tight max-w-2xl">
                {introText}
              </p>
            </>
          )}
        </header>

        {/* ─── Groups Grid ─── */}
        <ul
          role="list"
          aria-label={heading}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none"
        >
          {groups.map((group, i) => {
            const img =
              group.image && typeof group.image === 'object'
                ? (group.image as PayloadImage)
                : null
            const label = String(i + 1).padStart(2, '0')

            return (
              <li
                key={group.id ?? i}
                data-aud-card
                className="relative overflow-hidden rounded-[2px] min-h-[340px] sm:min-h-[380px] lg:min-h-[460px]"
              >
                {/* Background image - full bleed, editorial treatment */}
                <div className="absolute inset-0 z-0">
                  {img?.url ? (
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      loading="lazy"
                      className="object-cover contrast-[1.05]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-foreground/70 to-foreground" />
                  )}
                </div>

                {/* Dark gradient - vignette: dark bottom for text, subtle top for label */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/50 via-50% to-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col p-6 sm:p-8 lg:p-10">
                  {/* Top: group label with primary number */}
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                    {t('groupLabel')} <span className="text-white">{label}</span>
                  </span>

                  {/* Bottom: title + accent line + description */}
                  <div className="mt-auto flex flex-col gap-4">
                    <h3 className="text-xl sm:text-2xl lg:text-[1.75rem] font-heading uppercase font-medium leading-tight tracking-[-0.02em] text-white">
                      {group.title}
                    </h3>

                    <div className="w-10 h-[2px] bg-primary" aria-hidden="true" />

                    <p className="text-sm lg:text-[0.95rem] text-white/80 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  {/* Watermark number */}
                  <span
                    aria-hidden="true"
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 text-[5rem] sm:text-[6rem] lg:text-[8rem] font-medium font-heading text-white/[0.2] pointer-events-none select-none leading-none"
                  >
                    {label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
