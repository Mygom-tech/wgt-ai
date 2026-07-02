'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Button } from '@/components/ui/Button'
import { gsap, useGSAP } from '@/lib/gsap'
import type { LandingPage } from '@/payload-types'

type HowItWorksProps = {
  howItWorks: LandingPage['howItWorks']
}

export function HowItWorks({ howItWorks }: HowItWorksProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('howItWorks')

  const heading = howItWorks.heading
  const steps = howItWorks.steps ?? []

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-how-char]')
      const stepEls = sectionRef.current.querySelectorAll('[data-how-step]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(stepEls, { opacity: 1, y: 0 })
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
        tl.from(
          chars,
          {
            yPercent: 100, // Characters start 100% below baseline
            rotateX: -60, // Characters rotate in from behind
            opacity: 0,
            stagger: 0.015, // 15ms between each character
            duration: 1.2,
            ease: 'expo.out',
          },
          0,
        )
      }

      // Step card stagger - starts after characters begin
      if (stepEls.length) {
        tl.from(
          stepEls,
          {
            y: 30,
            opacity: 0,
            stagger: 0.1,
            duration: 1.0,
            ease: 'power3.out',
          },
          0.3,
        )
      }
    },
    { scope: sectionRef },
  )

  return (
    <Section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      variant="light"
    >
      <GridLines columns={16} rows={12} className="opacity-40" />

      <Container size="xl" className="relative z-10">
        <header ref={headerRef} className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-24 max-w-3xl">
          <Eyebrow label={howItWorks.eyebrow || t('eyebrow')} />

          <h2
            id="how-it-works-heading"
            className="text-[clamp(2.5rem,6vw,7.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading flex flex-wrap gap-x-[0.2em] perspective-2000"
          >
            {heading.split(' ').map((word, i) => (
              <span key={i} className="heading-reveal-mask inline-flex gap-[0.1em] pb-1">
                {word.split('').map((char, j) => (
                  <span key={j} data-how-char className="inline-block origin-top">
                    {char}
                  </span>
                ))}
                <span className="inline-block">&nbsp;</span>
              </span>
            ))}
          </h2>
        </header>

        <ol
          role="list"
          aria-label={heading}
          data-how-steps
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-sm overflow-hidden list-none"
        >
          {steps.map((step, i) => {
            const label = String(i + 1).padStart(2, '0')

            return (
              <li
                key={step.id ?? i}
                data-how-step
                className="relative flex flex-col bg-background p-6 sm:p-8 lg:p-10 min-h-[240px] sm:min-h-[260px] lg:min-h-[300px]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-foreground/60">
                  {t('phaseLabel')} {label}
                </span>

                <div className="mt-auto flex flex-col gap-4">
                  <h3 className="text-xl sm:text-2xl lg:text-[1.75rem] font-heading uppercase font-medium leading-tight tracking-[-0.02em] text-foreground">
                    {step.title}
                  </h3>

                  <div className="w-8 h-px bg-primary/50" />

                  <p className="text-body text-foreground/60 leading-relaxed">{step.description}</p>
                </div>

                <span
                  aria-hidden="true"
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 text-[5rem] sm:text-[6rem] lg:text-[8rem] font-medium font-heading text-foreground/[0.03] pointer-events-none select-none leading-none"
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-12 lg:mt-16 flex justify-center">
          <Button href={howItWorks.ctaUrl || '#register'} variant="cta" size="lg">
            {howItWorks.ctaText || t('cta')}
            <span aria-hidden="true" className="ml-2">
              &rarr;
            </span>
          </Button>
        </div>
      </Container>
    </Section>
  )
}
