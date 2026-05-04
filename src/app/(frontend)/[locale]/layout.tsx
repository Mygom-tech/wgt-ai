import React from 'react'
import type { Metadata, Viewport } from 'next'
import type { Organization, WebSite, WithContext } from 'schema-dts'
import { Inter, Jost } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/GoogleTagManager'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { extractFaviconUrls } from '@/lib/getFavicons'
import { getSiteUrl, queryGlobal } from '@/lib/payload-data'
import { buildAlternateLanguages } from '@/lib/generateMeta'
import { getHtmlLang, type LocaleCode } from '@/i18n/locales'
import { getTwitterHandle } from '@/lib/socialUtils'
import { Header } from '@/components/Header'
import type { Image as PayloadImage } from '@/payload-types'
import { Preloader } from '@/components/Preloader'
import { SmoothScroll } from '@/components/SmoothScroll'
import { CookieConsent } from '@/components/CookieConsent'
import { Footer } from '@/sections/Footer'
import { StickyMobileBar } from '@/components/StickyMobileBar'

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-jost',
  display: 'swap',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
}

export async function generateStaticParams() {
  const enabled = await getEnabledLocales()
  return enabled.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const [settings, enabledLocales] = await Promise.all([
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
  ])
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, '')
  const favicons = extractFaviconUrls(settings)

  const browserIcons: Array<{ url: string; sizes?: string; type?: string }> = []
  if (favicons.svg) browserIcons.push({ url: favicons.svg, type: 'image/svg+xml' })
  if (favicons.png32) browserIcons.push({ url: favicons.png32, sizes: '32x32', type: 'image/png' })
  if (favicons.png16) browserIcons.push({ url: favicons.png16, sizes: '16x16', type: 'image/png' })

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ${siteName}`,
      default: siteName,
    },
    description: settings.defaultMeta?.description || siteName,
    openGraph: {
      locale: getHtmlLang(locale),
      siteName,
    },
    twitter: {
      site: getTwitterHandle(settings.socialLinks),
    },
    alternates: {
      languages,
    },
    icons: {
      icon: browserIcons.length > 0 ? browserIcons : undefined,
      apple: favicons.apple180
        ? { url: favicons.apple180, sizes: '180x180', type: 'image/png' }
        : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    formatDetection: { email: false, address: false, telephone: false },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  const enabledLocales = await getEnabledLocales()
  if (!enabledLocales.includes(locale as LocaleCode)) {
    redirect('/?__fallback=1')
  }

  setRequestLocale(locale)

  const [settings, newsletterData, messages] = await Promise.all([
    getSiteSettings(locale as LocaleCode),
    queryGlobal('newsletter', { locale: locale as LocaleCode }),
    getMessages(),
  ])
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'
  const gtmId = settings.gtmId || ''

  const organizationJsonLd: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    ...(settings.logo && typeof settings.logo === 'object' && settings.logo.url
      ? { logo: settings.logo.url }
      : {}),
    ...(settings.socialLinks?.length
      ? {
          sameAs: settings.socialLinks
            .map((link: { url: string }) => link.url)
            .filter(Boolean),
        }
      : {}),
  }

  const websiteJsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
  }

  return (
    <html lang={getHtmlLang(locale)} suppressHydrationWarning>
      {gtmId ? (
        <head>
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        </head>
      ) : null}
      <body className={`${inter.variable} ${jost.variable} font-sans antialiased`} suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-foreground focus:ring-2 focus:ring-primary-400"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <Preloader />
          <JsonLd data={organizationJsonLd} />
          <JsonLd data={websiteJsonLd} />
          <NextIntlClientProvider messages={messages}>
            <Header
              enabledLocales={enabledLocales}
              logo={settings.logo as PayloadImage | null | undefined}
              ctaText={settings.headerCtaText}
            />
            <main id="main-content">{children}</main>
            <Footer
              enabledLocales={enabledLocales}
              logo={settings.logo as PayloadImage | null | undefined}
              supportEmail={settings.supportEmail}
              partnershipEmail={settings.partnershipEmail}
              footerText={settings.footerText}
              socialLinks={settings.socialLinks}
            />
            <StickyMobileBar
              text={newsletterData?.stickyBar?.text}
              ctaText={newsletterData?.stickyBar?.ctaText}
              enabled={newsletterData?.stickyBar?.enabled}
            />
            <CookieConsent />
            <GoogleTagManager gtmId={gtmId} />
            <GoogleTagManagerNoScript gtmId={gtmId} />
          </NextIntlClientProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
