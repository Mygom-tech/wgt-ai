import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { JsonLd } from '@/components/JsonLd'
import { CTA } from '@/sections/CTA'
import { queryCollection, queryGlobal, getSiteUrl } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { buildAlternateLanguages, generateBreadcrumbJsonLd } from '@/lib/generateMeta'
import { getTwitterHandle } from '@/lib/socialUtils'
import { defaultLocale, getHtmlLang, type LocaleCode } from '@/i18n/locales'
import type { Event, Image } from '@/payload-types'
import type { ItemList, WithContext } from 'schema-dts'
import { EventsPageClient } from './EventsPageClient'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  const enabledLocales = await getEnabledLocales()
  return enabledLocales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [eventsPageData, settings, enabledLocales] = await Promise.all([
    queryGlobal('events-page', { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
  ])
  const siteName = settings.siteName || 'Jarune'
  const siteUrl = getSiteUrl(settings)
  const heading = eventsPageData?.heading || siteName
  const title = `${heading} | ${siteName}`
  const description =
    eventsPageData?.subtitle || settings.defaultMeta?.description || ''

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/events`
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, '/events')

  const ogImage = settings.defaultMeta?.image
  const ogImageObj = ogImage && typeof ogImage === 'object' ? ogImage : null
  const ogImages = ogImageObj?.url
    ? [{ url: ogImageObj.url, alt: ogImageObj.alt || title, width: ogImageObj.width ?? 1200, height: ogImageObj.height ?? 630 }]
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
      site: getTwitterHandle(settings.socialLinks),
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

// ─── JSON-LD Helpers ────────────────────────────────────────────────────────

function buildISODateTime(
  dateStr: string,
  timeStr: string | null | undefined,
  _timeZone: string | null | undefined,
): string {
  const date = new Date(dateStr)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')

  if (!timeStr) return `${y}-${m}-${d}`

  const time = new Date(timeStr)
  const hh = String(time.getUTCHours()).padStart(2, '0')
  const mm = String(time.getUTCMinutes()).padStart(2, '0')

  return `${y}-${m}-${d}T${hh}:${mm}:00`
}

function formatToAttendanceMode(format: string | null | undefined): string | undefined {
  switch (format) {
    case 'in-person':
      return 'https://schema.org/OfflineEventAttendanceMode'
    case 'online':
      return 'https://schema.org/OnlineEventAttendanceMode'
    case 'hybrid':
      return 'https://schema.org/MixedEventAttendanceMode'
    default:
      return undefined
  }
}

function buildEventLocation(
  event: Event,
  eventPageUrl: string,
): Record<string, string> | undefined {
  if (event.format === 'online') {
    return { '@type': 'VirtualLocation', url: eventPageUrl }
  }
  if (event.location && (event.format === 'in-person' || event.format === 'hybrid')) {
    return { '@type': 'Place', name: event.location }
  }
  if (event.location) {
    return { '@type': 'Place', name: event.location }
  }
  return undefined
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function EventsListPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [result, eventsPageData, settings, newsletterData, t] = await Promise.all([
    queryCollection('events', {
      where: {
        status: { equals: 'published' },
        locales: { contains: locale },
      },
      sort: 'date',
      limit: 12,
      locale: locale as LocaleCode,
      depth: 1,
    }),
    queryGlobal('events-page', { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
    queryGlobal('newsletter', { locale: locale as LocaleCode }),
    getTranslations({ locale, namespace: 'events' }),
  ])

  const events = result.docs as Event[]
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'

  const heading = eventsPageData?.heading || siteName
  const eyebrow = eventsPageData?.eyebrow
  const subtitle = eventsPageData?.subtitle
  const backgroundWord = eventsPageData?.backgroundWord

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    siteName,
    siteUrl,
    heading,
    `${localePrefix}/events`,
  )

  // Build events JSON-LD ItemList
  const eventsListUrl = `${siteUrl}${localePrefix}/events`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventItems: any[] = events.map((event, i) => {
    const firstImage = (event.gallery || []).find(
      (img): img is Image => typeof img === 'object' && img !== null && !!img.url,
    )
    const attendanceMode = formatToAttendanceMode(event.format)
    const location = buildEventLocation(event, eventsListUrl)

    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: event.title,
        startDate: buildISODateTime(event.date, event.timeFrom, event.timeZone),
        ...(event.endDate || event.timeTo
          ? {
              endDate: buildISODateTime(
                event.endDate || event.date,
                event.timeTo,
                event.timeZone,
              ),
            }
          : {}),
        ...(location ? { location } : {}),
        ...(attendanceMode ? { eventAttendanceMode: attendanceMode } : {}),
        organizer: { '@type': 'Organization', name: siteName, url: siteUrl },
        url: `${siteUrl}${localePrefix}/events/${event.slug}`,
        ...(event.excerpt ? { description: event.excerpt } : {}),
        ...(firstImage?.url ? { image: firstImage.url } : {}),
      },
    }
  })

  const eventsJsonLd: WithContext<ItemList> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: heading,
    numberOfItems: events.length,
    itemListElement: eventItems,
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={eventsJsonLd as WithContext<ItemList>} />
      <Section variant="light">
        <GridLines columns={16} rows={12} className="opacity-40" />

        {backgroundWord && (
          <div
            className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
            aria-hidden="true"
            data-nosnippet
          >
            <span
              className="font-heading font-black uppercase text-foreground/[0.03] tracking-[-0.05em] leading-none"
              style={{ fontSize: 'clamp(10rem, 25vw, 30rem)' }}
            >
              {backgroundWord}
            </span>
          </div>
        )}

        <Container size="xl" className="relative z-10">
          <header className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-20">
            {eyebrow && <Eyebrow label={eyebrow} color="primary" />}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-foreground">
                {heading}
              </h1>
              <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                <span className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" />
                  {t('inPerson')}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden="true" />
                  {t('online')}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B47FF]" aria-hidden="true" />
                  {t('hybrid')}
                </span>
              </div>
            </div>

            {subtitle && (
              <>
                <hr className="w-full h-[1px] bg-foreground/10 border-none" />
                <p className="text-body-lg font-medium text-foreground/60 leading-relaxed tracking-tight max-w-xl">
                  {subtitle}
                </p>
              </>
            )}
          </header>

          <Suspense>
            <EventsPageClient
              events={events}
              locale={locale}
              hasNextPage={result.hasNextPage ?? false}
            />
          </Suspense>
        </Container>
      </Section>

      {newsletterData?.heading && (
        <CTA newsletter={newsletterData} />
      )}
    </>
  )
}
