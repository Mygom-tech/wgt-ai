'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { defaultLocale } from '@/i18n/locales'

type StickyMobileBarProps = {
  text?: string | null
  ctaText?: string | null
  enabled?: boolean | null
}

export function StickyMobileBar({ text, ctaText, enabled }: StickyMobileBarProps) {
  const t = useTranslations('newsletter')
  const locale = useLocale()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const dismissed = sessionStorage.getItem('stickybar-dismissed') === 'true'
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    let newsletterVisible = false

    // IntersectionObserver for #newsletter section
    const newsletterEl = document.getElementById('newsletter')
    let observer: IntersectionObserver | null = null

    if (newsletterEl) {
      observer = new IntersectionObserver(
        ([entry]) => {
          newsletterVisible = entry.isIntersecting
          if (newsletterVisible) {
            setIsVisible(false)
          } else if (window.scrollY > 500) {
            setIsVisible(true)
          }
        },
        { threshold: 0 },
      )
      observer.observe(newsletterEl)
    }

    function handleScroll() {
      if (newsletterVisible) {
        setIsVisible(false)
        return
      }
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer?.disconnect()
    }
  }, [enabled])

  if (!enabled || isDismissed) return null

  function handleDismiss() {
    setIsDismissed(true)
    sessionStorage.setItem('stickybar-dismissed', 'true')
  }

  function handleSubscribeClick() {
    const el = document.getElementById('newsletter')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Not on the homepage — navigate to homepage with #newsletter hash
      const prefix = locale === defaultLocale ? '' : `/${locale}`
      window.location.href = `${prefix}/#newsletter`
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-foreground/95 backdrop-blur-sm border-t border-white/[0.08] px-4 py-3 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('dismiss')}
        className="absolute top-2 right-2 p-1 text-white/40 hover:text-white/70 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-center gap-3 pr-6">
        {text && (
          <span className="text-xs text-white/70 flex-1 min-w-0 truncate">
            {text}
          </span>
        )}
        <button
          type="button"
          onClick={handleSubscribeClick}
          className="bg-primary text-primary-foreground px-4 py-2 text-[10px] uppercase tracking-[0.3em] rounded-[2px] whitespace-nowrap shrink-0"
        >
          {ctaText ?? t('submitButton')}
        </button>
      </div>
    </div>
  )
}
