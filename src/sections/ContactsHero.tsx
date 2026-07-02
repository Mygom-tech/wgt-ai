'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { gsap, useGSAP } from '@/lib/gsap'
import type { Form } from '@/payload-types'

type ContactsHeroProps = {
  heading: string
  eyebrow?: string | null
  subtitle?: string | null
  backgroundWord?: string | null
  supportEmail?: string | null
  partnershipEmail?: string | null
  form: Form | null
  submitAction: (rawData: Record<string, string | boolean>) => Promise<{
    success: boolean
    message?: string
    errors?: Record<string, string>
  }>
}

export function ContactsHero({
  heading,
  eyebrow,
  subtitle,
  backgroundWord,
  supportEmail,
  partnershipEmail,
  form,
  submitAction,
}: ContactsHeroProps) {
  const t = useTranslations('contacts')
  const heroRef = useRef<HTMLElement>(null)

  // ─── Hero Entrance Animation ──────────────────────────────────────
  useGSAP(
    () => {
      if (!heroRef.current) return

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const chars = heroRef.current.querySelectorAll('[data-contact-char]')
      const formEl = heroRef.current.querySelector('[data-contact-form]')
      const cards = heroRef.current.querySelectorAll('[data-contact-card]')

      if (prefersReduced) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        if (formEl) gsap.set(formEl, { opacity: 1, y: 0 })
        gsap.set(cards, { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({ delay: 0.2 })

      // Character cascade on heading
      if (chars.length) {
        tl.from(
          chars,
          {
            yPercent: 100,
            rotateX: -60,
            opacity: 0,
            stagger: 0.015,
            duration: 1.2,
            ease: 'expo.out',
          },
          0,
        )
      }

      // Form rises in
      if (formEl) {
        tl.from(
          formEl,
          {
            y: 30,
            opacity: 0,
            duration: 1.0,
            ease: 'power3.out',
          },
          0.3,
        )
      }

      // Contact cards stagger in
      if (cards.length) {
        tl.from(
          cards,
          {
            y: 30,
            opacity: 0,
            stagger: 0.1,
            duration: 1.0,
            ease: 'power3.out',
          },
          0.5,
        )
      }
    },
    { scope: heroRef },
  )

  return (
    <Section ref={heroRef} variant="light">
      <GridLines columns={16} rows={12} className="opacity-40" />

      {/* Background watermark */}
      {backgroundWord && (
        <div
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
          aria-hidden="true"
          data-nosnippet
        >
          <span
            className="font-heading font-black uppercase text-foreground/[0.03] tracking-[-0.05em] leading-none"
            style={{ fontSize: 'clamp(10rem, 25vw, 30rem)' }}
          >
            {backgroundWord}
          </span>
        </div>
      )}

      <Container size="xl" className="relative z-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-20 max-w-3xl">
          <Eyebrow label={eyebrow || t('eyebrow')} color="primary" />

          {heading && (
            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-foreground flex flex-wrap gap-x-[0.2em] perspective-2000">
              {heading.split(' ').map((word, i) => (
                <span key={i} className="heading-reveal-mask inline-flex gap-[0.1em] pb-1">
                  {word.split('').map((char, j) => (
                    <span key={j} data-contact-char className="inline-block origin-top">
                      {char}
                    </span>
                  ))}
                  <span className="inline-block">&nbsp;</span>
                </span>
              ))}
            </h1>
          )}

          {subtitle && (
            <>
              <hr className="w-full h-[1px] bg-foreground/10 border-none" />
              <p className="text-body-lg font-medium text-foreground/60 leading-relaxed tracking-tight max-w-xl">
                {subtitle}
              </p>
            </>
          )}
        </header>

        {/* Contact form - between subtitle and email cards */}
        {form && (
          <div className="mb-16 lg:mb-20">
            <div data-contact-form className="mx-auto max-w-2xl">
              <FormRenderer form={form} submitAction={submitAction} variant="light" />
            </div>
          </div>
        )}

        {/* Contact cards */}
        {(supportEmail || partnershipEmail) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                data-contact-card
                className="group border border-foreground/10 p-6 transition-colors hover:border-primary/30 hover:bg-primary/[0.02] rounded-[2px]"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center border border-foreground/10 text-primary rounded-[2px]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/40 block mb-1.5">
                      {t('supportLabel')}
                    </span>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {supportEmail}
                    </span>
                  </div>
                </div>
              </a>
            )}

            {partnershipEmail && (
              <a
                href={`mailto:${partnershipEmail}`}
                data-contact-card
                className="group border border-foreground/10 p-6 transition-colors hover:border-primary/30 hover:bg-primary/[0.02] rounded-[2px]"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center border border-foreground/10 text-primary rounded-[2px]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/40 block mb-1.5">
                      {t('partnershipLabel')}
                    </span>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {partnershipEmail}
                    </span>
                  </div>
                </div>
              </a>
            )}
          </div>
        )}
      </Container>
    </Section>
  )
}
