'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { LanguageSelector } from '@/components/header/LanguageSelector'
import type { LocaleCode } from '@/i18n/locales'
import type { Image as PayloadImage, SiteSetting } from '@/payload-types'

type FooterProps = {
  enabledLocales: LocaleCode[]
  logo?: PayloadImage | string | null
  supportEmail?: string | null
  partnershipEmail?: string | null
  footerText?: string | null
  socialLinks?: SiteSetting['socialLinks']
}

function isPopulatedImage(logo: PayloadImage | string | null | undefined): logo is PayloadImage {
  return typeof logo === 'object' && logo !== null && 'url' in logo && !!logo.url
}

const quickLinks = [
  { key: 'home', href: '/' },
  { key: 'course', href: '/#skills' },
  { key: 'events', href: '/events' },
  { key: 'blog', href: '/blog' },
  { key: 'faq', href: '/faq' },
  { key: 'contact', href: '/contacts' },
] as const

const legalLinks = [
  { key: 'terms', href: '/legal/terms-and-conditions' },
  { key: 'privacy', href: '/legal/privacy-policy' },
  { key: 'cookies', href: '/legal/cookie-policy' },
] as const

function SocialIcon({ platform }: { platform: string }) {
  const iconProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true as const,
  }

  switch (platform) {
    case 'facebook':
      return (
        <svg {...iconProps}>
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.049 1.541.104v3.305h-1.238c-1.561 0-2.073.59-2.073 2.132v2.017h3.211l-.551 3.667h-2.66v8.107A12.005 12.005 0 0 0 12 24c-.32 0-.637-.013-.952-.037z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...iconProps}>
          <path d="M7.03.084c-1.277.06-2.149.264-2.913.558a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .607 4.152C.314 4.916.11 5.788.05 7.065.006 8.02 0 8.328 0 12s.006 3.98.05 4.935c.06 1.277.264 2.149.558 2.913a5.88 5.88 0 0 0 1.384 2.126 5.88 5.88 0 0 0 2.126 1.384c.764.294 1.636.498 2.913.558C8.02 23.994 8.328 24 12 24s3.98-.006 4.935-.05c1.277-.06 2.149-.264 2.913-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.294-.764.498-1.636.558-2.913.044-.955.05-1.263.05-4.935s-.006-3.98-.05-4.935c-.06-1.277-.264-2.149-.558-2.913a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.848.607C19.084.314 18.212.11 16.935.05 15.98.006 15.672 0 12 0S8.02.006 7.03.084m.14 21.693c-1.17-.054-1.805-.249-2.228-.415a3.88 3.88 0 0 1-1.44-.937 3.88 3.88 0 0 1-.937-1.44c-.166-.423-.361-1.058-.415-2.228C2.105 15.81 2.1 15.524 2.1 12s.005-3.81.05-4.757c.054-1.17.249-1.805.415-2.228a3.88 3.88 0 0 1 .937-1.44 3.88 3.88 0 0 1 1.44-.937c.423-.166 1.058-.361 2.228-.415C8.19 2.105 8.476 2.1 12 2.1s3.81.005 4.757.05c1.17.054 1.805.249 2.228.415a3.88 3.88 0 0 1 1.44.937 3.88 3.88 0 0 1 .937 1.44c.166.423.361 1.058.415 2.228.045.947.05 1.233.05 4.757s-.005 3.81-.05 4.757c-.054 1.17-.249 1.805-.415 2.228a3.88 3.88 0 0 1-.937 1.44 3.88 3.88 0 0 1-1.44.937c-.423.166-1.058.361-2.228.415-.947.045-1.233.05-4.757.05s-3.81-.005-4.757-.05m9.585-16.263a1.44 1.44 0 1 0 0-2.88 1.44 1.44 0 0 0 0 2.88M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
        </svg>
      )
    case 'x':
      return (
        <svg {...iconProps}>
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...iconProps}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065m1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...iconProps}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...iconProps}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      )
    case 'pinterest':
      return (
        <svg {...iconProps}>
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.042-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.174.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026z" />
        </svg>
      )
    case 'github':
      return (
        <svg {...iconProps}>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      )
    default:
      return null
  }
}

const linkClasses = cn(
  'text-sm text-white/60 transition-colors duration-200 hover:text-white py-1.5 block',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] rounded-sm',
)

const headingClasses = 'text-[10px] font-semibold uppercase tracking-[0.4em] text-white/40 mb-6'

export function Footer({
  enabledLocales,
  logo,
  supportEmail,
  partnershipEmail,
  footerText,
  socialLinks,
}: FooterProps) {
  const t = useTranslations('footer')
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const cols = sectionRef.current.querySelectorAll('[data-footer-col]')
      const bottom = sectionRef.current.querySelector('[data-footer-bottom]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([...Array.from(cols), bottom], { opacity: 1, y: 0 })
        return
      }

      // GSAP owns initial hidden state (not CSS) - prevents invisible footer
      // after client-side navigation where ScrollTrigger positions go stale
      gsap.set(cols, { opacity: 0, y: 30 })
      gsap.set(bottom, { opacity: 0, y: 20 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: contentRef.current, start: 'top 85%', once: true },
      })

      tl.to(cols, { y: 0, opacity: 1, stagger: 0.1, duration: 1.0, ease: 'power3.out' }, 0)
      tl.to(bottom, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.5)
    },
    { scope: sectionRef },
  )

  return (
    <Section ref={sectionRef} variant="dark" noPadding>
      <GridLines columns={16} rows={8} className="opacity-[0.02]" lineColor="rgba(255,255,255,0.12)" />

      <Container size="xl" as="footer" className="relative z-10">
        <div ref={contentRef}>
          {/* Top divider */}
          <hr aria-hidden="true" className="h-px bg-white/10 border-none" />

          {/* Main 4-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pt-16 lg:pt-20 pb-12 lg:pb-16">
            {/* Col 1: Logo */}
            <div data-footer-col>
              <Link href="/" aria-label="Home" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm">
                {isPopulatedImage(logo) ? (
                  <Image
                    src={logo.url as string}
                    alt={logo.alt || ''}
                    height={24}
                    width={120}
                    className="h-6 w-auto object-contain brightness-0 invert"
                  />
                ) : (
                  <span className="text-sm font-bold tracking-[-0.02em] text-white uppercase font-heading">
                    Mygom
                  </span>
                )}
              </Link>
            </div>

            {/* Col 2: Quick Links */}
            <div data-footer-col>
              <nav aria-label={t('aria.quickLinks')}>
                <h3 className={headingClasses}>{t('navigationHeading')}</h3>
                <ul role="list">
                  {quickLinks.map(({ key, href }) => (
                    <li key={key}>
                      <Link href={href} className={linkClasses}>
                        {t(`links.${key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Col 3: Legal Links */}
            <div data-footer-col>
              <nav aria-label={t('aria.legalLinks')}>
                <h3 className={headingClasses}>{t('legalHeading')}</h3>
                <ul role="list">
                  {legalLinks.map(({ key, href }) => (
                    <li key={key}>
                      <Link href={href} className={linkClasses}>
                        {t(`legal.${key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Col 4: Contact + Social */}
            <div data-footer-col>
              <h3 className={headingClasses}>{t('contactHeading')}</h3>

              {supportEmail && (
                <div className="mb-4">
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] block mb-1">
                    {t('contact.supportLabel')}
                  </span>
                  <a href={`mailto:${supportEmail}`} className={linkClasses}>
                    {supportEmail}
                  </a>
                </div>
              )}

              {partnershipEmail && (
                <div className="mb-6">
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] block mb-1">
                    {t('contact.partnershipLabel')}
                  </span>
                  <a href={`mailto:${partnershipEmail}`} className={linkClasses}>
                    {partnershipEmail}
                  </a>
                </div>
              )}

              {socialLinks && socialLinks.length > 0 && (
                <div className="mt-6">
                  <h4 className={headingClasses}>{t('socialHeading')}</h4>
                  <ul role="list" aria-label={t('aria.socialLinks')} className="flex items-center gap-1">
                    {socialLinks.map((link) => (
                      <li key={link.id || link.platform}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${t('aria.socialPrefix')} ${link.platform}`}
                          className={cn(
                            'flex items-center justify-center w-9 h-9 rounded-md text-white/40 transition-colors duration-200 hover:text-white',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]',
                          )}
                        >
                          <SocialIcon platform={link.platform} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            data-footer-bottom
            className="border-t border-white/[0.08] py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            {footerText && (
              <p className="text-xs text-white/40 tracking-wide">{footerText}</p>
            )}
            <LanguageSelector enabledLocales={enabledLocales} placement="top" variant="dark" />
          </div>

          {/* Credit */}
          <p className="text-center text-[11px] text-white/30 pb-6">
            Made by{' '}
            <a
              href="https://mygom.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors duration-200"
            >
              Mygom.tech
            </a>
            {' '}with <span className="text-red-400">&#9829;</span>
          </p>
        </div>
      </Container>
    </Section>
  )
}
