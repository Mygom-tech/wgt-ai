'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { EventCardGallery } from './EventCardGallery'
import { AddToCalendarDropdown } from './AddToCalendarDropdown'
import type { Event, Image } from '@/payload-types'

type EventCardProps = {
  event: Event
  locale: string
  isPast?: boolean
}

const formatBadgeStyles: Record<string, string> = {
  'in-person': 'bg-primary/10 text-primary',
  online: 'bg-accent/10 text-accent',
  hybrid: 'bg-[#3B47FF]/10 text-[#3B47FF]',
}

const formatTranslationKeys: Record<string, 'inPerson' | 'online' | 'hybrid'> = {
  'in-person': 'inPerson',
  online: 'online',
  hybrid: 'hybrid',
}

function formatEventDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatDateRange(date: string, endDate: string | null | undefined, locale: string): string {
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

export function EventCard({ event, locale, isPast = false }: EventCardProps) {
  const t = useTranslations('events')

  const galleryImages = (event.gallery || []).filter(
    (img): img is Image => typeof img === 'object' && img !== null && !!img.url,
  )

  const displayLocation =
    event.location || (event.format === 'online' ? t('online') : null)

  const hasRegistration = !!event.registrationUrl

  return (
    <article className="group overflow-hidden rounded-sm border border-foreground/[0.08] bg-surface transition-colors hover:border-foreground/[0.15]">
      <Link
        href={`/events/${event.slug}`}
        className="block"
      >
        <div className="aspect-video overflow-hidden">
          <EventCardGallery images={galleryImages} title={event.title} />
        </div>

        <div className="p-6 flex flex-col gap-3">
          {event.format && (
            <span
              className={cn(
                'inline-flex w-fit px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] rounded-[2px]',
                formatBadgeStyles[event.format] || 'bg-muted/10 text-muted',
              )}
            >
              {t(formatTranslationKeys[event.format] || 'inPerson')}
            </span>
          )}

          <h3 className="text-lg font-heading font-medium leading-snug text-foreground line-clamp-2">
            {event.title}
          </h3>

          <div className="flex flex-col gap-1.5 text-sm text-muted">
            <time dateTime={event.date}>
              {formatDateRange(event.date, event.endDate, locale)}
            </time>
            {event.timeFrom && (
              <span>
                {formatEventTime(event.timeFrom, event.timeTo, event.timeZone)}
              </span>
            )}
            {displayLocation && <span>{displayLocation}</span>}
          </div>

          {event.excerpt && (
            <p className="text-sm text-foreground/60 line-clamp-2">
              {event.excerpt}
            </p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-3 px-6 pb-6 pt-0">
        {isPast ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] rounded-full bg-foreground/[0.06] text-muted">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {t('pastEvent')}
          </span>
        ) : (
          <>
            {hasRegistration && (
              <a
                href={event.registrationUrl!}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {t('register')}
              </a>
            )}
            <AddToCalendarDropdown event={event} />
          </>
        )}
      </div>
    </article>
  )
}
