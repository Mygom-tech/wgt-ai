'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { gsap, useGSAP } from '@/lib/gsap'
import type { Partner, Image as PayloadImage } from '@/payload-types'

type PartnersProps = {
  eyebrow?: string | null
  heading: string
  subtitle?: string | null
  backgroundWord?: string | null
  visitWebsiteLabel?: string | null
  partners: Partner[]
}

export function Partners({ eyebrow, heading, subtitle, backgroundWord, visitWebsiteLabel, partners }: PartnersProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-ptr-char]')
      const logos = sectionRef.current.querySelectorAll('[data-ptr-logo]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([...Array.from(chars), ...Array.from(logos)], { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
        },
      })

      if (chars.length) {
        tl.from(chars, {
          yPercent: 100,
          rotateX: -60,
          opacity: 0,
          stagger: 0.015,
          duration: 1.2,
          ease: 'expo.out',
        }, 0)
      }

      if (logos.length) {
        tl.from(logos, {
          y: 20,
          opacity: 0,
          stagger: 0.06,
          duration: 0.8,
          ease: 'power3.out',
        }, 0.3)
      }
    },
    { scope: sectionRef },
  )

  if (!partners.length) return null

  return (
    <Section ref={sectionRef} id="partners" aria-labelledby="partners-heading" variant="dark">
      <GridLines columns={16} rows={12} className="opacity-[0.02]" lineColor="rgba(255,255,255,0.12)" />

      {/* Background watermark */}
      <div
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
        aria-hidden="true"
        data-nosnippet
      >
        <span className="text-[clamp(10rem,25vw,30rem)] font-black uppercase text-white/[0.02] tracking-[-0.05em] leading-none">
          {backgroundWord}
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        {/* Header */}
        <header ref={headerRef} className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-20 max-w-3xl">
          {eyebrow && <Eyebrow label={eyebrow} color="primary" />}

          <h2
            id="partners-heading"
            className="text-[clamp(2.5rem,6vw,7.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-white flex flex-wrap gap-x-[0.2em] perspective-2000"
          >
            {heading.split(' ').map((word, i) => (
              <span key={i} className="overflow-hidden inline-flex gap-[0.1em] pb-1">
                {word.split('').map((char, j) => (
                  <span key={j} data-ptr-char className="inline-block origin-top">
                    {char}
                  </span>
                ))}
                <span className="inline-block">&nbsp;</span>
              </span>
            ))}
          </h2>

          {subtitle && (
            <>
              <hr className="w-full h-[1px] bg-white/10 border-none" />
              <p className="text-body-lg font-medium text-white/50 leading-relaxed tracking-tight max-w-xl">
                {subtitle}
              </p>
            </>
          )}
        </header>

        {/* Logo grid */}
        <ul role="list" className="flex flex-wrap justify-center gap-x-10 gap-y-8 lg:gap-x-14 lg:gap-y-10">
          {partners.map((partner) => {
            const logo = typeof partner.logo === 'string' ? null : (partner.logo as PayloadImage)
            if (!logo?.url) return null

            const inner = (
              <Image
                src={logo.url}
                alt={logo.alt || partner.organizationName}
                width={logo.width ?? 160}
                height={logo.height ?? 48}
                sizes="(max-width: 1024px) 120px, 160px"
                className="max-h-full w-auto object-contain brightness-0 invert"
              />
            )

            return (
              <li key={partner.id} data-ptr-logo>
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener"
                    aria-label={`${partner.organizationName}${visitWebsiteLabel ? ` - ${visitWebsiteLabel}` : ''}`}
                    className="flex items-center justify-center h-10 lg:h-12 px-4 transition-opacity duration-500 opacity-50 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 focus-visible:outline-offset-4 rounded-sm"
                  >
                    {inner}
                  </a>
                ) : (
                  <span role="img" aria-label={partner.organizationName} className="flex items-center justify-center h-10 lg:h-12 px-4 opacity-50">
                    {inner}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
