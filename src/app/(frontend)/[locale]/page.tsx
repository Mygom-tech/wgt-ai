import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Hero } from '@/sections/Hero'
import { Problem } from '@/sections/Problem'
import { Skills } from '@/sections/Skills'
import { HowItWorks } from '@/sections/HowItWorks'
import { Audience } from '@/sections/Audience'
import { Registration } from '@/sections/Registration'
import { Testimonials } from '@/sections/Testimonials'
import { CTA } from '@/sections/CTA'
import { Partners } from '@/sections/Partners'
import { FAQ } from '@/sections/FAQ'
import { submitForm } from '@/app/(frontend)/[locale]/actions/register'
import { JsonLd } from '@/components/JsonLd'
import { getSiteUrl, queryGlobal, queryCollection } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { resolveMedia, buildAlternateLanguages } from '@/lib/generateMeta'
import { extractHtml } from '@/lib/lexical-html'
import { defaultLocale, getHtmlLang, type LocaleCode } from '@/i18n/locales'
import type { LandingPage } from '@/payload-types'

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
  const title = `${t('home')} | ${defaultMeta?.title || siteName}`
  const description = defaultMeta?.description || ''

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}`
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, '')

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

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  const [landingData, testimonialsResult, partnersResult, faqResult, newsletterData, settings] = await Promise.all([
    queryGlobal('landing-page', {
      locale: locale as LocaleCode,
      depth: 2,
    }),
    queryCollection('testimonials', {
      where: { featured: { equals: true }, status: { equals: 'published' } },
      sort: 'order',
      limit: 6,
      locale: locale as LocaleCode,
    }),
    queryCollection('partners', {
      where: { status: { equals: 'published' } },
      sort: 'sortOrder',
      limit: 30,
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

  const hero = landingData?.hero ?? {
    heading: 'Technology\nshould work\nfor everyone.',
    highlightWord: 'everyone',
    eyebrow: 'Strategic Engineering Partner',
    subtitle:
      'Earn a free Google AI Professional Certificate - a practical course on Coursera to help you use AI at work.',
    ctaText: 'Apply Now',
  }

  const problem = landingData?.problem as LandingPage['problem']

  const skills = landingData?.skills

  const howItWorks = landingData?.howItWorks

  const audience = landingData?.audience

  const registration = landingData?.registration as LandingPage['registration']

  // Extract form from relationship (populated at depth: 2)
  const registrationForm =
    registration?.form && typeof registration.form === 'object' ? registration.form : null

  const testimonialsSection = landingData?.testimonials
  const testimonialDocs = testimonialsResult.docs

  const partnersSection = landingData?.partners
  const partnerDocs = partnersResult.docs

  const faqSection = landingData?.faq
  const faqDocs = faqResult.docs

  async function handleRegistrationSubmit(rawData: Record<string, string | boolean>) {
    'use server'
    return submitForm(registrationForm!.id, locale, rawData)
  }

  const siteUrl = getSiteUrl(settings)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'MYGOM',
          description: hero.subtitle || 'Free AI education program',
          url: siteUrl,
          ...(testimonialDocs.length > 0
            ? {
                alumni: testimonialDocs.map((t) => ({
                  '@type': 'Person',
                  name: t.name,
                  ...(t.role ? { jobTitle: t.role } : {}),
                  ...(t.company ? { worksFor: { '@type': 'Organization', name: t.company } } : {}),
                })),
              }
            : {}),
          ...(partnerDocs.length > 0
            ? {
                sponsor: partnerDocs.map((p) => ({
                  '@type': 'Organization',
                  name: p.organizationName,
                  ...(p.website ? { url: p.website } : {}),
                })),
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'Google AI Professional Certificate',
          description:
            hero.subtitle ||
            'A practical course on Coursera to help you use AI at work.',
          provider: {
            '@type': 'Organization',
            name: 'Google',
          },
          isAccessibleForFree: true,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
            category: 'Free',
          },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Online',
          },
          inLanguage: locale,
          ...(skills?.items && skills.items.length > 0
            ? {
                teaches: skills.items.map((item) => ({
                  '@type': 'DefinedTerm',
                  name: item.title,
                  description: item.description,
                })),
              }
            : {}),
        }}
        />
      <Hero hero={hero} />
      {problem && <Problem problem={problem} />}
      {skills && <Skills skills={skills} />}
      {howItWorks && <HowItWorks howItWorks={howItWorks} />}
      {audience && <Audience audience={audience} />}
      {registration && registrationForm && (
        <Registration
          registration={registration}
          form={registrationForm}
          submitAction={handleRegistrationSubmit}
        />
      )}
      {testimonialsSection?.heading && testimonialDocs.length > 0 && (
        <Testimonials
          eyebrow={testimonialsSection.eyebrow}
          heading={testimonialsSection.heading}
          subtitle={testimonialsSection.subtitle}
          backgroundWord={testimonialsSection.backgroundWord}
          testimonials={testimonialDocs}
        />
      )}
      {partnersSection?.heading && partnerDocs.length > 0 && (
        <Partners
          eyebrow={partnersSection.eyebrow}
          heading={partnersSection.heading}
          subtitle={partnersSection.subtitle}
          backgroundWord={partnersSection.backgroundWord}
          visitWebsiteLabel={partnersSection.visitWebsiteLabel}
          partners={partnerDocs}
        />
      )}
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
      {newsletterData?.heading && (
        <CTA newsletter={newsletterData} />
      )}
    </>
  )
}
