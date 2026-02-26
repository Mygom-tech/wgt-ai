import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FAQ } from '@/sections/FAQ'
import { CTA } from '@/sections/CTA'
import { JsonLd } from '@/components/JsonLd'
import { getSiteUrl, queryGlobal, queryCollection } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { buildAlternateLanguages, resolveMedia } from '@/lib/generateMeta'
import { extractHtml } from '@/lib/lexical-html'
import { defaultLocale, getHtmlLang, type LocaleCode } from '@/i18n/locales'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const [settings, enabledLocales, t] = await Promise.all([
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
    getTranslations({ locale, namespace: 'meta' }),
  ])

  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'
  const defaultMeta = settings.defaultMeta
  const title = `${t('faq')} | ${defaultMeta?.title || siteName}`
  const description = defaultMeta?.description || ''

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/faq`
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, '/faq')

  const ogImage = resolveMedia(defaultMeta?.image)
  const ogImages = ogImage?.url
    ? [{ url: ogImage.url, alt: ogImage.alt || title, width: ogImage.width ?? 1200, height: ogImage.height ?? 630 }]
    : []

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: 'website',
      locale: getHtmlLang(locale),
      ...(ogImages.length ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImages.length ? { images: ogImages.map((img) => img.url) } : {}),
    },
    alternates: {
      canonical: url,
      languages,
    },
  }
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params

  const [landingData, faqResult, newsletterData, settings] = await Promise.all([
    queryGlobal('landing-page', {
      locale: locale as LocaleCode,
    }),
    queryCollection('faq-items', {
      where: { status: { equals: 'published' }, locales: { contains: locale } },
      sort: 'sortOrder',
      limit: 50,
      locale: locale as LocaleCode,
    }),
    queryGlobal('newsletter', {
      locale: locale as LocaleCode,
    }),
    getSiteSettings(locale as LocaleCode),
  ])

  const faqSection = landingData?.faq
  const faqDocs = faqResult?.docs ?? []
  const siteUrl = getSiteUrl(settings)

  return (
    <>
      {faqSection?.heading && faqDocs.length > 0 && (
        <FAQ
          eyebrow={faqSection.eyebrow}
          heading={faqSection.heading}
          subtitle={faqSection.subtitle}
          backgroundWord={faqSection.backgroundWord}
          items={faqDocs}
        />
      )}

      {faqDocs.length > 0 && (() => {
        const faqEntities = faqDocs
          .map((faq) => {
            const html = extractHtml(faq.answer)
            if (!html) return null
            return {
              '@type': 'Question' as const,
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer' as const,
                text: html,
              },
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)

        return faqEntities.length > 0 ? (
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              url: `${siteUrl}/faq`,
              inLanguage: locale,
              mainEntity: faqEntities,
            }}
          />
        ) : null
      })()}

      {newsletterData?.heading && (
        <CTA newsletter={newsletterData} />
      )}
    </>
  )
}
