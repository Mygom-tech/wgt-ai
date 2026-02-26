'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { gsap, useGSAP } from '@/lib/gsap'
import type { LandingPage, Form } from '@/payload-types'

type RegistrationProps = {
  registration: NonNullable<LandingPage['registration']>
  form: Form
  submitAction: (rawData: Record<string, string | boolean>) => Promise<{
    success: boolean
    message?: string
    errors?: Record<string, string>
  }>
}

export function Registration({ registration, form, submitAction }: RegistrationProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('registration')

  const heading = registration.heading ?? ''
  const subtitle = registration.subtitle

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-reg-char]')
      const formEl = sectionRef.current.querySelector('[data-reg-form]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set(formEl, { opacity: 1, y: 0 })
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

      // Form fade-in with rise
      if (formEl) {
        tl.from(formEl, {
          y: 30,
          opacity: 0,
          duration: 1.0,
          ease: 'power3.out',
        }, 0.3)
      }
    },
    { scope: sectionRef },
  )

  return (
    <Section ref={sectionRef} id="register" aria-labelledby="register-heading" variant="dark">
      <GridLines
        columns={16}
        rows={12}
        className="opacity-[0.02]"
        lineColor="rgba(255,255,255,0.12)"
      />

      <Container size="xl" className="relative z-10">
        {/* ─── Header ─── */}
        <header ref={headerRef} className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-20">
          <Eyebrow label={t('eyebrow')} color="primary" />

          {heading && (
            <h2
              id="register-heading"
              className="text-[clamp(2.5rem,6vw,7.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-white flex flex-wrap gap-x-[0.2em] perspective-2000"
            >
              {heading.split(' ').map((word, i) => (
                <span key={i} className="overflow-hidden inline-flex gap-[0.1em] pb-1">
                  {word.split('').map((char, j) => (
                    <span key={j} data-reg-char className="inline-block origin-top">
                      {char}
                    </span>
                  ))}
                  <span className="inline-block">&nbsp;</span>
                </span>
              ))}
            </h2>
          )}

          {subtitle && (
            <>
              <hr className="w-full h-[1px] bg-white/10 border-none" />
              <p className="text-body-lg font-medium text-white/50 leading-relaxed tracking-tight max-w-3xl">
                {subtitle}
              </p>
            </>
          )}
        </header>

        {/* ─── Form ─── */}
        <div data-reg-form className="mx-auto max-w-2xl">
          <FormRenderer form={form} submitAction={submitAction} />
        </div>
      </Container>
    </Section>
  )
}
