'use client'

import { useRef } from 'react'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Button } from '@/components/ui/Button'
import { gsap, useGSAP } from '@/lib/gsap'

type NotFoundHeroProps = {
  eyebrow: string
  heading: string
  subtitle: string
  cta: string
}

export function NotFoundHero({ eyebrow, heading, subtitle, cta }: NotFoundHeroProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const chars = sectionRef.current.querySelectorAll('[data-nf-char]')
      const eyebrowEl = sectionRef.current.querySelector('[data-nf-eyebrow]')
      const dividerEl = sectionRef.current.querySelector('[data-nf-divider]')
      const headingEl = sectionRef.current.querySelector('[data-nf-heading]')
      const subtitleEl = sectionRef.current.querySelector('[data-nf-subtitle]')
      const ctaEl = sectionRef.current.querySelector('[data-nf-cta]')

      if (prefersReduced) {
        gsap.set([chars, eyebrowEl, dividerEl, headingEl, subtitleEl, ctaEl], {
          opacity: 1,
          y: 0,
          yPercent: 0,
          rotateX: 0,
          scaleX: 1,
        })
        return
      }

      const tl = gsap.timeline({ delay: 0.3 })

      // Eyebrow fades in
      if (eyebrowEl) {
        tl.from(eyebrowEl, { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, 0)
      }

      // "404" character cascade - staggered with 3D rotation
      if (chars.length) {
        tl.from(
          chars,
          {
            yPercent: 100,
            rotateX: -60,
            opacity: 0,
            stagger: 0.08,
            duration: 1.2,
            ease: 'expo.out',
          },
          0.1,
        )
      }

      // Divider scales in
      if (dividerEl) {
        tl.from(dividerEl, { scaleX: 0, duration: 0.8, ease: 'power3.inOut' }, 0.6)
      }

      // Heading fades up
      if (headingEl) {
        tl.from(headingEl, { opacity: 0, y: 30, duration: 1.0, ease: 'power3.out' }, 0.7)
      }

      // Subtitle fades up
      if (subtitleEl) {
        tl.from(subtitleEl, { opacity: 0, y: 20, duration: 1.0, ease: 'power3.out' }, 0.85)
      }

      // CTA fades up
      if (ctaEl) {
        tl.from(ctaEl, { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, 1.0)
      }
    },
    { scope: sectionRef },
  )

  return (
    <Section ref={sectionRef} variant="light" className="min-h-[80vh] flex flex-col justify-center">
      <GridLines columns={16} rows={12} className="opacity-40" />

      {/* Background watermark */}
      <div
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
        aria-hidden="true"
        data-nosnippet
      >
        <span
          className="font-heading font-black text-foreground/[0.03] tracking-[-0.05em] leading-none"
          style={{ fontSize: 'clamp(10rem, 25vw, 30rem)' }}
        >
          404
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Eyebrow */}
          <div data-nf-eyebrow>
            <Eyebrow label={eyebrow} color="primary" variant="dot" />
          </div>

          {/* 404 Number */}
          <h1
            className="mt-8 font-heading font-bold tracking-[-0.04em] leading-none text-foreground perspective-2000 flex gap-[0.05em]"
            style={{ fontSize: 'clamp(8rem, 22vw, 16rem)' }}
          >
            {'404'.split('').map((char, i) => (
              <span key={i} className="heading-reveal-mask inline-flex pb-2">
                <span data-nf-char className="inline-block origin-top">
                  {char}
                </span>
              </span>
            ))}
          </h1>

          {/* Divider + Heading */}
          <hr
            data-nf-divider
            className="mt-6 lg:mt-8 w-16 h-[1px] bg-primary border-none origin-center"
          />

          <h2
            data-nf-heading
            className="mt-6 font-heading font-medium tracking-[-0.02em] text-foreground"
            style={{ fontSize: 'clamp(1.5rem, 1.25rem + 1.5vw, 2.5rem)' }}
          >
            {heading}
          </h2>

          {/* Subtitle */}
          <p
            data-nf-subtitle
            className="mt-4 text-body-lg text-foreground/60 leading-relaxed max-w-lg"
          >
            {subtitle}
          </p>

          {/* CTA */}
          <div data-nf-cta className="mt-10">
            <Button href="/" variant="primary" size="lg" className="bg-primary hover:bg-primary/90">
              {cta}
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}
