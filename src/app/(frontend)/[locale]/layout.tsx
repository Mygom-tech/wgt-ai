import React from 'react'
import type { Metadata, Viewport } from 'next'
import type { Organization, WebSite, WithContext } from 'schema-dts'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/GoogleTagManager'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { getSiteUrl } from '@/lib/payload-data'
import { buildAlternateLanguages } from '@/lib/generateMeta'
import { getHtmlLang, type LocaleCode } from '@/i18n/locales'
import { getTwitterHandle } from '@/lib/socialUtils'
import { Header } from '@/components/Header'
import { CookieConsent } from '@/components/CookieConsent'

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
    redirect('/')
  }

  const settings = await getSiteSettings(locale as LocaleCode)
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'
  const gtmId = settings.gtmId || ''
  const messages = await getMessages()

  const organizationJsonLd: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  }

  const websiteJsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
  }

  return (
    <html lang={getHtmlLang(locale)}>
      {gtmId ? (
        <head>
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        </head>
      ) : null}
      <body>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <NextIntlClientProvider messages={messages}>
          <Header enabledLocales={enabledLocales} />
          <main>{children}</main>
          <CookieConsent />
          <GoogleTagManager gtmId={gtmId} />
          <GoogleTagManagerNoScript gtmId={gtmId} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
