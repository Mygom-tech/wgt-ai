'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { MagneticButton } from '@/components/MagneticButton'
import { HamburgerButton } from '@/components/header/HamburgerButton'
import { LanguageSelector } from '@/components/header/LanguageSelector'
import { MobileMenu } from '@/components/header/MobileMenu'
import { NavHashLink } from '@/components/header/NavHashLink'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import type { LocaleCode } from '@/i18n/locales'
import type { Image as PayloadImage } from '@/payload-types'
import { gsap, useGSAP } from '@/lib/gsap'

type HeaderProps = {
  enabledLocales: LocaleCode[]
  logo?: PayloadImage | string | null
  ctaText?: string | null
}

function isPopulatedImage(logo: PayloadImage | string | null | undefined): logo is PayloadImage {
  return typeof logo === 'object' && logo !== null && 'url' in logo && !!logo.url
}

export function Header({ enabledLocales, logo, ctaText }: HeaderProps) {
  const t = useTranslations('header')
  const ctaLabel = ctaText?.trim() || t('cta')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDarkHero, setIsDarkHero] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  const navLinks = useMemo(
    () => [
      { href: '#problem', label: t('nav.about') },
      { href: '#skills', label: t('nav.course') },
      { href: '#how-it-works', label: t('nav.howItWorks') },
      { href: '/events', label: t('nav.events') },
      { href: '/blog', label: t('nav.blog') },
      { href: '/contacts', label: t('nav.contact') },
    ],
    [t],
  )

  useEffect(() => {
    function update() {
      setIsScrolled(window.scrollY > 20)
      setIsDarkHero(document.body.classList.contains('dark-hero'))
    }
    update()
    // MutationObserver catches dark-hero class changes (added/removed by page components)
    const mo = new MutationObserver(update)
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      mo.disconnect()
      window.removeEventListener('scroll', update)
    }
  }, [])

  // ─── Entrance Animation ────────────────────────────────────────
  useGSAP(
    () => {
      const logoEl = logoRef.current
      const navEl = navRef.current
      const actionsEl = actionsRef.current

      if (!logoEl || !navEl || !actionsEl) return

      const links = navEl.querySelectorAll('[data-nav-link]')

      // Reduced motion: show all elements immediately, skip animation
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        gsap.set([logoEl, actionsEl], { opacity: 1 })
        gsap.set(links, { opacity: 1 })
        return
      }

      // Transform initial states (opacity handled by CSS opacity-0)
      gsap.set([logoEl, actionsEl], { y: -15 })
      gsap.set(links, { y: -10 })

      const tl = gsap.timeline({ paused: true, delay: 0.1 })

      tl.to(logoEl, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0)
      tl.to(links, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out' }, 0.1)
      tl.to(actionsEl, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.2)

      const isPreloaderDone = document.body.classList.contains('preloader-done')
      if (isPreloaderDone) {
        tl.play()
      } else {
        const handleStartExit = () => tl.play()
        window.addEventListener('preloaderStartExit', handleStartExit)
        return () => window.removeEventListener('preloaderStartExit', handleStartExit)
      }
    },
    { scope: headerRef },
  )

  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((prev) => !prev), [])
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  // Light text when over a dark hero and not yet scrolled into solid bg
  const isLight = isDarkHero && !isScrolled

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-expo',
          isScrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-foreground/5 py-3'
            : 'bg-transparent border-transparent py-6',
        )}
      >
        <Container size="xl">
          <div className="flex items-center justify-between">
            {/* Minimalist Logo */}
            <div ref={logoRef} className="opacity-0">
              <MagneticButton strength={0.1}>
                <Link
                  href="/"
                  aria-label="Go to homepage"
                  className="flex items-center gap-2 group relative z-10"
                >
                  {isPopulatedImage(logo) ? (
                    <Image
                      src={logo.url as string}
                      alt={logo.alt || ''}
                      height={24}
                      width={120}
                      className={cn(
                        'h-6 w-auto object-contain transition-all duration-700',
                        isLight && 'brightness-0 invert',
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-bold tracking-[-0.02em] uppercase font-heading transition-colors duration-700',
                        isLight ? 'text-white' : 'text-foreground',
                      )}
                    >
                      Mygom
                    </span>
                  )}
                </Link>
              </MagneticButton>
            </div>

            {/* Desktop Nav - Architectural & Clean */}
            <nav
              ref={navRef}
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-2"
            >
              {navLinks.map((link) => {
                const isHash = link.href.startsWith('#')
                const isRoute = link.href.startsWith('/')
                const linkClassName = cn(
                  'relative text-xs font-bold uppercase tracking-[0.2em] transition-colors px-5 py-2',
                  isLight
                    ? 'text-white/80 hover:text-white'
                    : 'text-foreground/60 hover:text-foreground',
                )
                return (
                  <div key={link.href} data-nav-link className="opacity-0">
                    <MagneticButton strength={0.15} innerStrength={0.05}>
                      {isHash ? (
                        <NavHashLink hash={link.href} className={linkClassName}>
                          {link.label}
                        </NavHashLink>
                      ) : isRoute ? (
                        <Link href={link.href} className={linkClassName}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={linkClassName}>
                          {link.label}
                        </a>
                      )}
                    </MagneticButton>
                  </div>
                )
              })}
            </nav>

            {/* Actions */}
            <div ref={actionsRef} className="flex items-center gap-6 relative z-10 opacity-0">
              <LanguageSelector enabledLocales={enabledLocales} className="hidden lg:flex" />

              <MagneticButton strength={0.15}>
                <NavHashLink
                  hash="#register"
                  className={cn(
                    'hidden lg:inline-flex rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-700 hover:scale-[1.02] shadow-lg text-foreground hover:bg-primary hover:text-white',
                    isLight ? 'bg-white' : 'bg-secondary',
                  )}
                >
                  {ctaLabel}
                </NavHashLink>
              </MagneticButton>

              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onToggle={toggleMobileMenu}
                openLabel={t('aria.openMenu')}
                closeLabel={t('aria.closeMenu')}
                className={cn(
                  'lg:hidden transition-colors duration-700',
                  isLight ? 'text-white' : 'text-foreground',
                )}
              />
            </div>
          </div>
        </Container>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        enabledLocales={enabledLocales}
        ctaText={ctaLabel}
        navLinks={navLinks}
      />
    </>
  )
}
