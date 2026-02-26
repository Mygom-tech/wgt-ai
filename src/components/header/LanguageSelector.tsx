'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { gsap, useGSAP } from '@/lib/gsap'
import { locales, type LocaleCode } from '@/i18n/locales'
import { cn } from '@/lib/utils'

type LanguageSelectorProps = {
  enabledLocales: LocaleCode[]
  placement?: 'bottom' | 'top'
  variant?: 'light' | 'dark'
  className?: string
}

export function LanguageSelector({
  enabledLocales,
  placement = 'bottom',
  variant = 'light',
  className,
}: LanguageSelectorProps) {
  const t = useTranslations('header')
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const prevOpenRef = useRef(false)

  const availableLocales = locales.filter((l) => enabledLocales.includes(l.code))

  const close = useCallback(() => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [])

  const selectLocale = useCallback(
    (code: LocaleCode) => {
      router.replace(pathname, { locale: code })
      close()
    },
    [router, pathname, close],
  )

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, close])

  // Focus management for active option
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const options = listRef.current.querySelectorAll('[role="option"]')
      ;(options[focusedIndex] as HTMLElement)?.focus()
    }
  }, [focusedIndex])

  // GSAP dropdown animation
  useGSAP(
    () => {
      if (!listRef.current) return

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Initial render - hide dropdown
      if (!isOpen && !prevOpenRef.current) {
        gsap.set(listRef.current, { autoAlpha: 0, scale: 0.92 })
        prevOpenRef.current = isOpen
        return
      }

      if (isOpen && !prevOpenRef.current) {
        // Opening animation
        if (prefersReducedMotion) {
          gsap.set(listRef.current, { autoAlpha: 1, scale: 1, y: 0 })
        } else {
          const originY = placement === 'top' ? 8 : -8

          const tl = gsap.timeline()
          tl.fromTo(
            listRef.current,
            { autoAlpha: 0, scale: 0.92, y: originY },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.28, ease: 'back.out(2)' },
          )
        }
      } else if (!isOpen && prevOpenRef.current) {
        // Closing animation
        if (prefersReducedMotion) {
          gsap.set(listRef.current, { autoAlpha: 0 })
        } else {
          const tl = gsap.timeline()
          tl.to(
            listRef.current,
            {
              autoAlpha: 0,
              scale: 0.95,
              y: placement === 'top' ? 4 : -4,
              duration: 0.15,
              ease: 'power2.in',
            },
          )
        }
      }

      prevOpenRef.current = isOpen
    },
    { dependencies: [isOpen] },
  )

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        setFocusedIndex(e.key === 'ArrowDown' ? 0 : availableLocales.length - 1)
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        if (!isOpen) {
          setFocusedIndex(0)
        }
        break
      }
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('aria.languageSelector')}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
          variant === 'dark'
            ? 'text-white/60 transition-colors duration-200 hover:text-white'
            : 'text-neutral-700 transition-colors duration-200 hover:text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
      >
        <span className="uppercase">{currentLocale}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <ul
        ref={listRef}
        role="listbox"
        aria-label={t('aria.languageSelector')}
        tabIndex={-1}
        className={cn(
          'absolute right-0 z-50 min-w-[160px] overflow-hidden rounded-xl border border-neutral-200/80 bg-white py-1 shadow-xl shadow-black/[0.08]',
          placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          !isOpen && 'pointer-events-none',
        )}
      >
        {availableLocales.map((locale, index) => {
          const isSelected = locale.code === currentLocale

          return (
            <li
              key={locale.code}
              role="option"
              aria-selected={isSelected}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => selectLocale(locale.code)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors duration-150',
                isSelected
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50',
              )}
            >
              <span className="w-6 text-center text-xs uppercase text-neutral-400">
                {locale.code}
              </span>
              <span>{locale.label}</span>
              {isSelected && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="ml-auto text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}