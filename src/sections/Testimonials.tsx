'use client'

import { useRef } from 'react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { gsap, useGSAP } from '@/lib/gsap'
import type { Testimonial } from '@/payload-types'

type TestimonialsProps = {
  eyebrow?: string | null
  heading: string
  subtitle?: string | null
  backgroundWord?: string | null
  testimonials: Testimonial[]
}

export function Testimonials({ eyebrow, heading, subtitle, backgroundWord, testimonials }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const [featured, ...rest] = testimonials

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-tst-char]')
      const quote = sectionRef.current.querySelector('[data-tst-quote]')
      const cards = sectionRef.current.querySelectorAll('[data-tst-card]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(quote, { opacity: 1, y: 0 })
        gsap.set(cards, { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
        },
      })

      // Character cascade
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

      // Featured quote
      if (quote) {
        tl.from(quote, {
          y: 30,
          opacity: 0,
          duration: 1.0,
          ease: 'power3.out',
        }, 0.3)
      }

      // Supporting cards
      if (cards.length) {
        tl.from(cards, {
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 1.0,
          ease: 'power3.out',
        }, 0.5)
      }
    },
    { scope: sectionRef },
  )

  if (!featured) return null

  return (
    <Section ref={sectionRef} id="testimonials" aria-labelledby="testimonials-heading" variant="light">
      <GridLines columns={16} rows={12} className="opacity-40" />

      {/* Background watermark - positioned at section level for full width */}
      <div
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
        aria-hidden="true"
        data-nosnippet
      >
        <span className="text-[clamp(10rem,25vw,30rem)] font-black uppercase text-foreground/[0.03] tracking-[-0.05em] leading-none">
          {backgroundWord}
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        {/* ─── Header ─── */}
        <header ref={headerRef} className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-20 max-w-3xl">
          {eyebrow && <Eyebrow label={eyebrow} />}

          <h2
            id="testimonials-heading"
            className="text-[clamp(2.5rem,6vw,7.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-foreground flex flex-wrap gap-x-[0.2em] perspective-2000"
          >
            {heading.split(' ').map((word, i) => (
              <span key={i} className="overflow-hidden inline-flex gap-[0.1em] pb-1">
                {word.split('').map((char, j) => (
                  <span key={j} data-tst-char className="inline-block origin-top">
                    {char}
                  </span>
                ))}
                <span className="inline-block">&nbsp;</span>
              </span>
            ))}
          </h2>

          {subtitle && (
            <>
              <hr className="w-full h-[1px] bg-foreground/10 border-none" />
              <p className="text-body-lg font-medium text-foreground/50 leading-relaxed tracking-tight max-w-xl">
                {subtitle}
              </p>
            </>
          )}
        </header>

        {/* ─── Featured Testimonial ─── */}
        <blockquote data-tst-quote className="relative mb-16 lg:mb-24 pl-8 lg:pl-12">
          {/* Decorative open-quote */}
          <span
            className="absolute top-0 left-0 text-[6rem] leading-none font-heading text-primary/10 select-none pointer-events-none -translate-y-4"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <p className="text-[clamp(1.25rem,2.5vw,2rem)] font-heading font-normal italic leading-relaxed text-foreground/80 max-w-4xl">
            &ldquo;{featured.quote}&rdquo;
          </p>

          <footer className="mt-6 flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-foreground/50">
            <span className="w-8 h-[1px] bg-primary" aria-hidden="true" />
            <span>
              {featured.name}
              {featured.role && ` · ${featured.role}`}
              {featured.company && ` · ${featured.company}`}
            </span>
          </footer>
        </blockquote>

        {/* ─── Supporting Testimonials ─── */}
        {rest.length > 0 && (
          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-sm overflow-hidden list-none"
          >
            {rest.map((testimonial, i) => (
              <li
                key={testimonial.id}
                data-tst-card
                className="bg-background p-6 sm:p-8 lg:p-10 min-h-[200px] flex flex-col gap-4"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-foreground/50">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <blockquote className="flex flex-col gap-4 flex-1">
                  <p className="text-body-lg text-foreground/70 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  <footer className="mt-auto text-xs uppercase tracking-[0.3em] text-foreground/50">
                    {testimonial.name}
                    {testimonial.role && ` · ${testimonial.role}`}
                  </footer>
                </blockquote>

                <div className="w-8 h-px bg-primary/30" aria-hidden="true" />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  )
}
