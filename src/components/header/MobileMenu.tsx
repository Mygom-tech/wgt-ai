'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { LanguageSelector } from '@/components/header/LanguageSelector'
import { NavHashLink } from '@/components/header/NavHashLink'
import { Link } from '@/i18n/navigation'
import type { LocaleCode } from '@/i18n/locales'

type NavLink = {
  href: string
  label: string
}

type MobileMenuProps = {
  isOpen: boolean
  onClose: () => void
  enabledLocales: LocaleCode[]
  ctaText: string
  navLinks: NavLink[]
}

export function MobileMenu({ isOpen, onClose, enabledLocales, ctaText, navLinks }: MobileMenuProps) {
  const t = useTranslations('header')
  const containerRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const prevOpenRef = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('lenis-stopped')
    } else {
      document.body.classList.remove('lenis-stopped')
    }
    return () => {
      document.body.classList.remove('lenis-stopped')
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap
  const handleFocusTrap = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab' || !containerRef.current) return

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [isOpen],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleFocusTrap)
    return () => document.removeEventListener('keydown', handleFocusTrap)
  }, [isOpen, handleFocusTrap])

  // GSAP animations
  useGSAP(
    () => {
      if (!containerRef.current || !linksRef.current) return

      // Kill any in-progress animation
      if (timelineRef.current) {
        timelineRef.current.kill()
        timelineRef.current = null
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const linkElements = linksRef.current.querySelectorAll('[data-mobile-nav-link]')

      if (isOpen && !prevOpenRef.current) {
        // ─── Opening Animation ──────────────────────────────────────────────
        if (prefersReducedMotion) {
          gsap.set(containerRef.current, { autoAlpha: 1 })
          gsap.set(linkElements, { autoAlpha: 1, y: 0 })
          if (ctaRef.current) gsap.set(ctaRef.current, { autoAlpha: 1, scale: 1 })
          if (langRef.current) gsap.set(langRef.current, { autoAlpha: 1 })
        } else {
          gsap.set(containerRef.current, { autoAlpha: 1 })

          const tl = gsap.timeline()
          timelineRef.current = tl

          tl.fromTo(
            linkElements,
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5, ease: 'power3.out' },
          )
          if (ctaRef.current) {
            tl.fromTo(
              ctaRef.current,
              { y: 20, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' },
              '-=0.2',
            )
          }
          if (langRef.current) {
            tl.fromTo(
              langRef.current,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3, ease: 'power2.out' },
              '-=0.15',
            )
          }
        }
      } else if (!isOpen && prevOpenRef.current) {
        // ─── Closing Animation ──────────────────────────────────────────────
        if (prefersReducedMotion) {
          gsap.set(containerRef.current, { autoAlpha: 0 })
          gsap.set(linkElements, { autoAlpha: 0 })
          if (ctaRef.current) gsap.set(ctaRef.current, { autoAlpha: 0 })
          if (langRef.current) gsap.set(langRef.current, { autoAlpha: 0 })
        } else {
          const tl = gsap.timeline()
          timelineRef.current = tl

          // 1. Language selector fades out
          if (langRef.current) {
            tl.to(langRef.current, {
              autoAlpha: 0,
              duration: 0.12,
              ease: 'power2.in',
            })
          }

          // 2. CTA shrinks and fades
          if (ctaRef.current) {
            tl.to(
              ctaRef.current,
              {
                y: 10,
                autoAlpha: 0,
                duration: 0.18,
                ease: 'power2.in',
              },
              langRef.current ? '-=0.06' : 0,
            )
          }

          // 3. Links stagger out - bottom to top (reverse)
          const reversedLinks = Array.from(linkElements).reverse()
          tl.to(
            reversedLinks,
            {
              y: -20,
              autoAlpha: 0,
              stagger: 0.04,
              duration: 0.2,
              ease: 'power2.in',
            },
            '-=0.1',
          )

          // 4. Container fades out
          tl.to(
            containerRef.current,
            {
              autoAlpha: 0,
              duration: 0.15,
              ease: 'power2.in',
            },
            '-=0.08',
          )
        }
      }

      prevOpenRef.current = isOpen
    },
    { dependencies: [isOpen] },
  )

  function handleLinkClick() {
    onClose()
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-40 bg-background',
        !isOpen && 'pointer-events-none invisible',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('aria.menu')}
    >
      <div className="flex h-full flex-col px-6 pb-8 pt-24">
        {/* Nav links */}
        <nav ref={linksRef} className="flex flex-1 flex-col gap-2">
          {navLinks.map((link) => {
            const isHash = link.href.startsWith('#')
            const isRoute = link.href.startsWith('/')
            const className = "block py-3 font-heading text-title font-medium text-foreground transition-colors hover:text-primary-600"
            return isHash ? (
              <NavHashLink
                key={link.href}
                hash={link.href}
                onClick={handleLinkClick}
                data-mobile-nav-link
                className={className}
              >
                {link.label}
              </NavHashLink>
            ) : isRoute ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                data-mobile-nav-link
                className={className}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                data-mobile-nav-link
                className={className}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto flex flex-col gap-6">
          {/* CTA */}
          <div ref={ctaRef}>
            <NavHashLink
              hash="#register"
              onClick={handleLinkClick}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white transition-all duration-300 ease-out hover:bg-[#333333] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
            >
              {ctaText}
            </NavHashLink>
          </div>

          {/* Language selector - opens upward since it's at the bottom */}
          <div ref={langRef} className="flex items-center justify-center">
            <LanguageSelector enabledLocales={enabledLocales} placement="top" />
          </div>
        </div>
      </div>
    </div>
  )
}
