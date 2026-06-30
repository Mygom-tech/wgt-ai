'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SkillCard } from '@/components/SkillCard'
import { Button } from '@/components/ui/Button'
import { gsap, useGSAP } from '@/lib/gsap'
import type { LandingPage, Image as PayloadImage } from '@/payload-types'

type SkillsProps = {
  skills: LandingPage['skills']
}

export function Skills({ skills }: SkillsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('skills')

  const heading = skills.heading
  const subtitle = skills.subtitle
  const items = skills.items ?? []
  const benefits = skills.benefits ?? []
  const benefitsHeading = skills.benefitsHeading

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-skills-char]')
      const cards = sectionRef.current.querySelectorAll('[data-skills-card]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(cards, { opacity: 1, y: 0 })
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

      // Card stagger - starts after characters begin
      tl.from(
        cards,
        {
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 1.0,
          ease: 'power3.out',
        },
        0.3,
      )
    },
    { scope: sectionRef },
  )

  return (
    <Section ref={sectionRef} id="skills" aria-labelledby="skills-heading" variant="dark">
      <GridLines
        columns={16}
        rows={12}
        className="opacity-[0.02]"
        lineColor="rgba(255,255,255,0.12)"
      />

      {/* Background watermark - positioned at section level for full width */}
      <div
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
        aria-hidden="true"
        data-nosnippet
      >
        <span className="text-[clamp(10rem,25vw,30rem)] font-black uppercase text-white/[0.02] tracking-[-0.05em] leading-none">
          {t('backgroundWord')}
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        {/* ─── Header ─── */}
        <header
          ref={headerRef}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-16 mb-16 lg:mb-24"
        >
          <div className="flex flex-col gap-5 lg:gap-6 max-w-3xl">
            <Eyebrow label={t('eyebrow')} />

            <h2
              id="skills-heading"
              className="text-[clamp(2.5rem,6vw,7.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-white flex flex-wrap gap-x-[0.2em] perspective-2000"
            >
              {heading.split(' ').map((word, i) => (
                <span key={i} className="heading-reveal-mask inline-flex gap-[0.1em] pb-1">
                  {word.split('').map((char, j) => (
                    <span key={j} data-skills-char className="inline-block origin-top">
                      {char}
                    </span>
                  ))}
                  <span className="inline-block">&nbsp;</span>
                </span>
              ))}
            </h2>
          </div>

          {subtitle && (
            <div className="w-full lg:w-[40%] lg:mb-3">
              <p className="text-body-lg font-medium text-white/60 leading-relaxed tracking-tight border-l-2 border-primary/30 pl-8 lg:pl-10">
                {subtitle}
              </p>
            </div>
          )}
        </header>

        {/* ─── Skill Grid ─── */}
        <ol
          role="list"
          aria-label={heading}
          data-skills-grid
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-sm overflow-hidden mb-24 lg:mb-36 list-none"
        >
          {items.map((item, i) => {
            const img =
              item.image && typeof item.image === 'object' ? (item.image as PayloadImage) : null

            return (
              <SkillCard
                key={item.id || i}
                title={item.title}
                description={item.description}
                image={img}
                index={i}
                skillLabel={t('skillLabel')}
                featured={i === 0}
              />
            )
          })}
        </ol>

        {/* ─── Benefits ─── */}
        {(benefits.length > 0 || benefitsHeading) && (
          <section
            aria-label={benefitsHeading ?? undefined}
            className="relative pt-16 lg:pt-20 border-t border-white/10"
          >
            {/* Header - full width, stacked */}
            <div className="flex flex-col gap-5 mb-12 lg:mb-16">
              <Eyebrow label={t('outcomesEyebrow')} variant="dot" />
              <h3 className="text-[clamp(2rem,4vw,4rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-white max-w-3xl">
                {benefitsHeading}
              </h3>
            </div>

            {/* Benefits grid - full width, 3 columns matching skills grid */}
            <ul
              role="list"
              className="grid grid-cols-1 md:grid-cols-3 gap-x-12 lg:gap-x-16 gap-y-8 lg:gap-y-12 list-none"
            >
              {benefits.map((benefit, i) => (
                <li key={i} className="flex flex-col gap-3 lg:gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-heading text-primary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <p className="text-body-lg font-medium text-white/80 leading-relaxed tracking-tight">
                    {benefit.text}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-12 lg:mt-16">
              <Button href={skills.ctaUrl || '#register'} variant="light" size="lg">
                {t('cta')}
                <span aria-hidden="true" className="ml-2">
                  &rarr;
                </span>
              </Button>
            </div>
          </section>
        )}
      </Container>
    </Section>
  )
}
