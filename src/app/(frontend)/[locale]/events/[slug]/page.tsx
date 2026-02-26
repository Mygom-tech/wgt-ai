import type { Metadata } from 'next'
import Link from 'next/link'
import NextImage from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Event as SchemaEvent, BreadcrumbList, WithContext } from 'schema-dts'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { ScrollReveal } from '@/components/ScrollReveal'
import { MagneticButton } from '@/components/MagneticButton'
import { JsonLd } from '@/components/JsonLd'
import { CTA } from '@/sections/CTA'
import { AddToCalendarDropdown } from '../AddToCalendarDropdown'
import { EventHero } from './EventHero'
import { EventGallery } from './EventGallery'
import { queryBySlug, queryCollection, queryGlobal, getSiteUrl } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { buildAlternateLanguages } from '@/lib/generateMeta'
import { getTwitterHandle } from '@/lib/socialUtils'
import { getHtmlLang, defaultLocale, type LocaleCode } from '@/i18n/locales'
import { submitForm } from '@/app/(frontend)/[locale]/actions/register'
import { EventRegistrationForm } from './EventRegistrationForm'
import type { Event, Image, Form } from '@/payload-types'
import type { LexicalRootData } from '@/components/RichTextRenderer'

type Props = {
  params: Promise<{ locale: string; slug: string }>
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

// ─── Date formatting helpers ────────────────────────────────────────────────

function formatEventDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function formatDateRange(
  date: string,
  endDate: string | null | undefined,
  locale: string,
): string {
  if (!endDate) return formatEventDate(date, locale)
  return `${formatEventDate(date, locale)} \u2013 ${formatEventDate(endDate, locale)}`
}

function formatEventTime(
  timeFrom: string,
  timeTo: string | null | undefined,
  timeZone: string | null | undefined,
): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  let result = fmt(timeFrom)
  if (timeTo) result += ` \u2013 ${fmt(timeTo)}`
  if (timeZone) {
    const abbr = new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'short',
    })
      .formatToParts(new Date(timeFrom))
      .find((p) => p.type === 'timeZoneName')?.value
    if (abbr) result += ` ${abbr}`
  }
  return result
}

// ─── Static Params ──────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const enabledLocales = await getEnabledLocales()
  const result = await queryCollection('events', {
    where: { status: { equals: 'published' } },
    limit: 100,
  })

  return result.docs.flatMap((doc) => {
    const event = doc as Event
    const eventLocales = event.locales ?? []
    return enabledLocales
      .filter((locale) => eventLocales.includes(locale))
      .map((locale) => ({ locale, slug: event.slug }))
  })
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = await queryBySlug('events', slug, {
    locale: locale as LocaleCode,
    depth: 2,
  })

  if (!doc) {
    return { title: 'Not Found' }
  }

  const event = doc as Event
  const eventLocales = event.locales ?? []

  // Event not published for this locale — treat as 404
  if (!eventLocales.includes(locale as LocaleCode)) {
    return { title: 'Not Found' }
  }
  const [settings, enabledLocales] = await Promise.all([
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
  ])
  const siteName = settings.siteName || 'Jarune'
  const siteUrl = getSiteUrl(settings)

  const title = `${event.title} | ${siteName}`
  const description = event.excerpt || ''

  const firstImage = (event.gallery || []).find(
    (img): img is Image => typeof img === 'object' && img !== null && !!img.url,
  )

  const relevantLocales = enabledLocales.filter((l) => eventLocales.includes(l))
  const languages = buildAlternateLanguages(relevantLocales, siteUrl, `/events/${slug}`)

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/events/${slug}`

  const ogImages = firstImage?.url
    ? [{
        url: firstImage.url,
        alt: firstImage.alt || event.title,
        width: firstImage.width ?? 1200,
        height: firstImage.height ?? 630,
      }]
    : []

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title: event.title,
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
      title: event.title,
      description,
      ...(ogImages.length ? { images: ogImages.map((img) => img.url) } : {}),
    },
    alternates: {
      canonical: url,
      languages,
    },
  }
}

// ─── Speaker Social Icons ────────────────────────────────────────────────

function SpeakerSocialIcon({ platform }: { platform: string }) {
  const size = 18
  switch (platform) {
    case 'linkedin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    case 'x':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'website':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      )
  }
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function EventDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [doc, eventsPageData, settings, newsletterData, t] = await Promise.all([
    queryBySlug('events', slug, { locale: locale as LocaleCode, depth: 2 }),
    queryGlobal('events-page', { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
    queryGlobal('newsletter', { locale: locale as LocaleCode }),
    getTranslations({ locale, namespace: 'events' }),
  ])

  if (!doc) notFound()

  const event = doc as Event

  // Event not published for this locale — 404
  const eventLocales = event.locales ?? []
  if (!eventLocales.includes(locale as LocaleCode)) notFound()
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'
  const eventsHeading = eventsPageData?.heading || siteName
  const eventsEyebrow = eventsPageData?.eyebrow

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const canonicalUrl = `${siteUrl}${localePrefix}/events/${slug}`

  const galleryImages = (event.gallery || []).filter(
    (img): img is Image => typeof img === 'object' && img !== null && !!img.url,
  )
  const heroImage = galleryImages[0] || null
  const extraGalleryImages = galleryImages.slice(1)

  const speakers = event.speakers || []

  // Extract populated registration form (depth: 2 populates the relationship)
  const registrationForm =
    event.registrationForm && typeof event.registrationForm === 'object'
      ? (event.registrationForm as Form)
      : null
  const registrationFormId = registrationForm?.id ?? null

  async function handleEventFormSubmit(rawData: Record<string, string | boolean>) {
    'use server'
    if (!registrationFormId) throw new Error('No registration form configured')
    return submitForm(registrationFormId, locale, rawData)
  }

  const formattedDate = formatDateRange(event.date, event.endDate, locale)
  const formattedTime = event.timeFrom
    ? formatEventTime(event.timeFrom, event.timeTo, event.timeZone)
    : null

  // Determine if event is past based on date
  const eventDate = new Date(event.date)
  eventDate.setHours(23, 59, 59, 999)
  const isPast = eventDate < new Date()

  // ─── JSON-LD ────────────────────────────────────────────────────────────

  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: eventsHeading,
        item: `${siteUrl}${localePrefix}/events`,
      },
      { '@type': 'ListItem', position: 3, name: event.title, item: canonicalUrl },
    ],
  }

  const attendanceMode = formatToAttendanceMode(event.format)
  const location = buildEventLocation(event, canonicalUrl)

   
  const eventJsonLd: WithContext<SchemaEvent> = {
    '@context': 'https://schema.org',
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
    url: canonicalUrl,
    ...(event.excerpt ? { description: event.excerpt } : {}),
    ...(heroImage?.url ? { image: heroImage.url } : {}),
  } as WithContext<SchemaEvent>

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={eventJsonLd as WithContext<SchemaEvent>} />

      {/* Zone 1 — Immersive Hero */}
      <EventHero
        title={event.title}
        eyebrow={eventsEyebrow ?? undefined}
        heroImage={heroImage}
        formattedDate={formattedDate}
        formattedTime={formattedTime}
        location={event.location}
        format={event.format}
        locale={locale}
        event={event}
        isPast={isPast}
      />

      {/* Zone 2 — Excerpt + Body */}
      <Section variant="light">
        <GridLines columns={16} rows={12} className="opacity-40" />
        <Container size="md">
          <article>
            {event.excerpt && (
              <ScrollReveal>
                <blockquote className="border-l-[3px] border-primary pl-6 italic text-foreground/70 leading-relaxed" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}>
                  {event.excerpt}
                </blockquote>
              </ScrollReveal>
            )}

            {event.excerpt && event.body && (
              <hr className="my-10 border-foreground/10" />
            )}

            {event.body && (
              <ScrollReveal>
                <RichTextRenderer
                  data={event.body as LexicalRootData | null | undefined}
                  className="prose-content"
                />
              </ScrollReveal>
            )}
          </article>
        </Container>
      </Section>

      {/* Zone 3 — Speakers */}
      {speakers.length > 0 && (
        <Section variant="white">
          {/* Background watermark */}
          <div
            className="absolute top-[10%] left-[-5%] whitespace-nowrap pointer-events-none select-none z-0"
            aria-hidden="true"
            data-nosnippet
          >
            <span className="text-[clamp(10rem,25vw,30rem)] font-black uppercase text-foreground/[0.04] tracking-[-0.05em] leading-none">
              {t('speakers')}
            </span>
          </div>

          <Container size="xl" className="relative z-10">
            <ScrollReveal>
              <Eyebrow label={t('speakers')} color="primary" />
            </ScrollReveal>

            <ScrollReveal className="mt-10" stagger={0.1}>
              <div
                className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3"
                aria-label={t('speakers')}
              >
                {speakers.map((speaker) => {
                  const photo =
                    typeof speaker.photo === 'object' && speaker.photo !== null
                      ? (speaker.photo as Image)
                      : null
                  return (
                    <div
                      key={speaker.id || speaker.name}
                      data-reveal
                      className="flex flex-col items-center text-center"
                    >
                      {photo?.url && (
                        <NextImage
                          src={photo.url}
                          alt={photo.alt || speaker.name}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      )}
                      <p className="mt-4 font-heading font-medium text-foreground text-lg">
                        {speaker.name}
                      </p>
                      {speaker.role && (
                        <p className="mt-1 text-sm text-muted">{speaker.role}</p>
                      )}
                      {speaker.bio && (
                        <p className="mt-2 text-sm text-foreground/60 leading-relaxed max-w-xs">
                          {speaker.bio}
                        </p>
                      )}
                      {speaker.socialLinks && speaker.socialLinks.length > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                          {speaker.socialLinks.map((link) => (
                            <a
                              key={link.id || link.url}
                              href={link.url}
                              target="_blank"
                              rel="noopener"
                              className="text-foreground/40 transition-colors hover:text-primary"
                              aria-label={`${speaker.name} — ${link.platform}`}
                            >
                              <SpeakerSocialIcon platform={link.platform} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      )}

      {/* Zone 4 — Gallery */}
      {extraGalleryImages.length > 0 && (
        <Section variant="light">
          <Container size="xl">
            <ScrollReveal>
              <Eyebrow label={t('eventGallery')} color="primary" />
            </ScrollReveal>

            <ScrollReveal className="mt-8">
              <EventGallery images={extraGalleryImages} />
            </ScrollReveal>
          </Container>
        </Section>
      )}

      {/* Zone 5 — Registration / Past event notice */}
      {isPast ? (
        <Section variant="light">
          <Container size="md" className="relative z-10">
            <ScrollReveal>
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-14 h-14 rounded-full bg-foreground/[0.06] flex items-center justify-center mb-5">
                  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-muted">
                  {t('eventEnded')}
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      ) : (event.registrationUrl || registrationForm) ? (
        <Section variant="dark">
          <GridLines columns={16} rows={12} className="opacity-[0.02]" lineColor="rgba(255,255,255,0.12)" />
          <Container size="md" className="relative z-10">
            <ScrollReveal>
              <Eyebrow label={t('registerHeading')} color="primary" />
              <h2
                className="mt-5 font-heading font-medium text-white uppercase tracking-[-0.02em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                {t('registerHeading')}
              </h2>
            </ScrollReveal>

            {registrationForm && (
              <ScrollReveal className="mt-10">
                <EventRegistrationForm
                  form={registrationForm}
                  submitAction={handleEventFormSubmit}
                />
              </ScrollReveal>
            )}

            {event.registrationUrl && (
              <ScrollReveal className="mt-10">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <MagneticButton strength={0.06}>
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener"
                      className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-full transition-all duration-700 hover:scale-[1.03] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] isolate overflow-hidden"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                        {t('register')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <svg
                          aria-hidden="true"
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M1 11L11 1M11 1H1M11 1V11"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </a>
                  </MagneticButton>

                  <AddToCalendarDropdown event={event} />
                </div>
              </ScrollReveal>
            )}
          </Container>
        </Section>
      ) : null}

      {/* Zone 6 — Newsletter CTA */}
      {newsletterData?.heading && (
        <CTA newsletter={newsletterData} />
      )}

      {/* Zone 7 — Back navigation */}
      <Section variant="light" className="!py-10">
        <Container size="md">
          <nav aria-label={t('backToEvents')}>
            <Link
              href={`/${locale}/events`}
              className="inline-flex items-center text-sm text-muted transition-colors hover:text-foreground"
            >
              {t('backToEvents')}
            </Link>
          </nav>
        </Container>
      </Section>
    </>
  )
}
