import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactsHero } from '@/sections/ContactsHero'
import { FAQ } from '@/sections/FAQ'
import { JsonLd } from '@/components/JsonLd'
import { getSiteUrl, queryGlobal, queryCollection } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { buildAlternateLanguages, resolveMedia } from '@/lib/generateMeta'
import { defaultLocale, getHtmlLang, type LocaleCode } from '@/i18n/locales'
import { extractHtml } from '@/lib/lexical-html'
import { submitForm } from '@/app/(frontend)/[locale]/actions/register'

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
  const title = `${t('contacts')} | ${defaultMeta?.title || siteName}`
  const description = defaultMeta?.description || ''

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/contacts`
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, '/contacts')

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

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'contacts' })

  const [contactsData, faqResult, settings] = await Promise.all([
    queryGlobal('contacts-page', {
      locale: locale as LocaleCode,
      depth: 2,
    }),
    queryCollection('faq-items', {
      where: { status: { equals: 'published' }, locales: { contains: locale } },
      sort: 'sortOrder',
      limit: 50,
      locale: locale as LocaleCode,
    }),
    getSiteSettings(locale as LocaleCode),
  ])

  const heading = contactsData?.heading ?? t('eyebrow')
  const subtitle = contactsData?.subtitle
  const backgroundWord = contactsData?.backgroundWord

  // Extract form from relationship (populated at depth: 2)
  const contactForm =
    contactsData?.form && typeof contactsData.form === 'object' ? contactsData.form : null

  const faqSection = contactsData?.faq
  const faqDocs = faqResult?.docs ?? []

  const formFallbackMessage = t('formHeading')
  const formId = contactForm?.id

  async function handleContactSubmit(rawData: Record<string, string | boolean>) {
    'use server'
    if (!formId) return { success: false, message: formFallbackMessage }
    return submitForm(formId, locale, rawData)
  }

  const siteUrl = getSiteUrl(settings)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: heading,
          description: subtitle || '',
          url: `${siteUrl}/contacts`,
          inLanguage: locale,
          ...(settings.supportEmail || settings.partnershipEmail
            ? {
                mainEntity: {
                  '@type': 'Organization',
                  name: settings.siteName || 'Jarune',
                  ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
                  ...(settings.partnershipEmail
                    ? {
                        contactPoint: {
                          '@type': 'ContactPoint',
                          email: settings.partnershipEmail,
                          contactType: 'partnerships',
                        },
                      }
                    : {}),
                },
              }
            : {}),
        }}
      />

      <ContactsHero
        heading={heading}
        eyebrow={contactsData?.eyebrow}
        subtitle={subtitle}
        backgroundWord={backgroundWord}
        supportEmail={settings.supportEmail}
        partnershipEmail={settings.partnershipEmail}
        form={contactForm}
        submitAction={handleContactSubmit}
      />

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
              inLanguage: locale,
              mainEntity: faqEntities,
            }}
          />
        ) : null
      })()}
    </>
  )
}
