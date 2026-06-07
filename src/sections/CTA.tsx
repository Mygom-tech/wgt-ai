'use client'

import { useRef, useState, useEffect, type FormEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { gsap, useGSAP } from '@/lib/gsap'
import { subscribeToNewsletter } from '@/app/(frontend)/[locale]/actions/subscribe'
import { pushToDataLayer } from '@/lib/gtm'
import type { Newsletter } from '@/payload-types'

type CTAProps = {
  newsletter: Newsletter
}

export function CTA({ newsletter }: CTAProps) {
  const locale = useLocale()
  const sectionRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const isSubmittingRef = useRef(false)
  const hasTrackedRef = useRef(false)
  const t = useTranslations('newsletter')

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSuccess) statusRef.current?.focus()
  }, [isSuccess])

  const heading = newsletter.heading ?? ''
  const subtitle = newsletter.subtitle
  const placeholder = newsletter.placeholder ?? t('emailLabel')
  const ctaText = newsletter.ctaText
  const successMessage = newsletter.successMessage

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const chars = sectionRef.current.querySelectorAll('[data-cta-char]')
      const formEl = sectionRef.current.querySelector('[data-cta-form]')
      const subtitleEl = sectionRef.current.querySelector('[data-cta-subtitle]')
      const divider = sectionRef.current.querySelector('[data-cta-divider]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(chars, { opacity: 1, yPercent: 0, rotateX: 0 })
        gsap.set([subtitleEl, formEl].filter(Boolean), { opacity: 1, y: 0 })
        gsap.set(divider, { opacity: 1, scaleX: 1 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
        },
      })

      // Character cascade
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

      // Divider line grow
      if (divider) {
        tl.from(
          divider,
          {
            scaleX: 0,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          0.3,
        )
      }

      // Subtitle fade
      if (subtitleEl) {
        tl.from(
          subtitleEl,
          {
            y: 30,
            opacity: 0,
            duration: 1.0,
            ease: 'power3.out',
          },
          0.4,
        )
      }

      // Form fade-in with rise
      if (formEl) {
        tl.from(
          formEl,
          {
            y: 30,
            opacity: 0,
            duration: 1.0,
            ease: 'power3.out',
          },
          0.5,
        )
      }
    },
    { scope: sectionRef, dependencies: [] },
  )

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSubmittingRef.current) return
    setError('')

    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('invalidEmail'))
      return
    }

    const formData = new FormData(e.currentTarget)
    const honeypot = formData.get('_hp') as string

    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      const result = await subscribeToNewsletter(
        locale,
        trimmed,
        newsletter.omnisendTag ?? undefined,
        honeypot,
      )

      if (result.success) {
        if (newsletter.gtmEventName && !honeypot && !hasTrackedRef.current) {
          hasTrackedRef.current = true
          pushToDataLayer({ event: newsletter.gtmEventName, language: locale })
        }
        setIsSuccess(true)
      } else {
        setError(result.error === 'INVALID_EMAIL' ? t('invalidEmail') : t('errorTitle'))
      }
    } catch {
      setError(t('errorTitle'))
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <Section
      ref={sectionRef}
      id="newsletter"
      aria-labelledby={heading ? 'newsletter-heading' : undefined}
      variant="light"
    >
      <GridLines columns={16} rows={8} className="opacity-40" />

      <Container size="xl" className="relative z-10">
        <div
          ref={cardRef}
          className="relative mx-auto max-w-4xl border border-foreground/[0.08] bg-surface px-8 py-16 sm:px-12 sm:py-20 md:px-16 md:py-24 lg:px-20 lg:py-28 rounded-sm"
        >
          {/* Inner content - centered */}
          <div className="flex flex-col items-center text-center">
            <Eyebrow label={t('eyebrow')} color="primary" />

            {heading && (
              <h2
                id="newsletter-heading"
                className="mt-6 text-[clamp(2rem,5vw,4.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-foreground flex flex-wrap justify-center gap-x-[0.2em] perspective-2000"
              >
                {heading.split(' ').map((word, i) => (
                  <span key={i} className="overflow-hidden inline-flex gap-[0.1em] pb-1">
                    {word.split('').map((char, j) => (
                      <span key={j} data-cta-char className="inline-block origin-top">
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
                <hr
                  data-cta-divider
                  aria-hidden="true"
                  className="w-16 h-[1px] bg-primary border-none mt-6 mb-5 origin-center"
                />
                <p
                  data-cta-subtitle
                  className="text-body-lg text-foreground/50 leading-relaxed tracking-tight max-w-xl"
                >
                  {subtitle}
                </p>
              </>
            )}

            {/* Form / Success */}
            <div data-cta-form className="w-full max-w-md mt-10">
              {isSuccess ? (
                <div
                  ref={statusRef}
                  role="status"
                  tabIndex={-1}
                  className="border border-primary/20 bg-primary/[0.05] p-8 sm:p-10 rounded-[2px] outline-none"
                >
                  <h3 className="text-lg font-heading font-medium uppercase tracking-[-0.02em] text-foreground mb-2">
                    {t('successTitle')}
                  </h3>
                  {successMessage && (
                    <p className="text-sm text-foreground/60 leading-relaxed">{successMessage}</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="_hp"
                    aria-label="Leave this field empty"
                    className="absolute -left-[9999px] w-0 h-0 overflow-hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label htmlFor="newsletter-email" className="sr-only">
                        {t('emailLabel')}
                      </label>
                      <input
                        type="email"
                        id="newsletter-email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (error) setError('')
                        }}
                        placeholder={placeholder}
                        autoComplete="email"
                        className="w-full border border-foreground/[0.08] bg-background px-4 py-3.5 text-[0.95rem] text-foreground placeholder:text-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors rounded-[2px]"
                        {...(error
                          ? {
                              'aria-invalid': true as const,
                              'aria-describedby': 'newsletter-error',
                            }
                          : {})}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.4em] hover:bg-primary/90 transition-colors rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSubmitting ? t('submitting') : (ctaText ?? t('submitButton'))}
                    </button>
                  </div>

                  {error && (
                    <p
                      id="newsletter-error"
                      role="alert"
                      className="mt-3 text-[11px] uppercase tracking-[0.15em] text-red-600"
                    >
                      {error}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
