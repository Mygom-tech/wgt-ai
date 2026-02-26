'use client'

import { useCallback } from 'react'
import { usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useLenis } from 'lenis/react'
import { defaultLocale } from '@/i18n/locales'

type NavHashLinkProps = {
  hash: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  'data-mobile-nav-link'?: boolean
  'data-nav-link'?: boolean
}

export function NavHashLink({
  hash,
  children,
  className,
  onClick,
  ...rest
}: NavHashLinkProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const lenis = useLenis()

  const isHomepage = pathname === '/'

  const scrollToHash = useCallback(
    (targetHash: string) => {
      const target = document.querySelector(targetHash)
      if (!target) return

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion || !lenis) {
        const top = target.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
      } else {
        lenis.scrollTo(target as HTMLElement, { offset: -80 })
      }

      history.replaceState(null, '', targetHash)
    },
    [lenis],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      // Fire external onClick first (e.g. close mobile menu)
      onClick?.()

      if (isHomepage) {
        // If body has lenis-stopped (mobile menu closing), wait for it to unlock
        if (document.body.classList.contains('lenis-stopped')) {
          const raf = requestAnimationFrame(() => {
            scrollToHash(hash)
          })
          return () => cancelAnimationFrame(raf)
        }
        scrollToHash(hash)
      } else {
        // Navigate to homepage with hash - ScrollToTop will handle scrolling
        const prefix = locale === defaultLocale ? '' : `/${locale}`
        window.location.href = `${prefix}/${hash}`
      }
    },
    [hash, isHomepage, locale, onClick, scrollToHash],
  )

  return (
    <a href={hash} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
