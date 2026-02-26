'use client'

import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { EventCalendar } from './EventCalendar'
import { EventFilters } from './EventFilters'
import { EventCard } from './EventCard'
import { loadMoreEvents } from '../actions/events'
import type { Event } from '@/payload-types'

type EventsPageClientProps = {
  events: Event[]
  locale: string
  hasNextPage: boolean
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isUpcoming(event: Event): boolean {
  const eventDate = new Date(event.date)
  const now = new Date()
  if (event.timeFrom) {
    const time = new Date(event.timeFrom)
    eventDate.setHours(time.getHours(), time.getMinutes())
    return eventDate >= now
  }
  // No time: upcoming until end of day
  eventDate.setHours(23, 59, 59, 999)
  return eventDate >= now
}

function getEventTimestamp(event: Event): number {
  const d = new Date(event.date)
  if (event.timeFrom) {
    const time = new Date(event.timeFrom)
    d.setHours(time.getHours(), time.getMinutes())
  }
  return d.getTime()
}

function buildCalendarDots(
  events: Event[],
  gridStart: string,
  gridEnd: string,
): Map<string, { count: number; formats: string[] }> {
  const dots = new Map<string, { count: number; formats: string[] }>()
  for (const event of events) {
    const startKey = toDateKey(new Date(event.date))
    const endKey = event.endDate ? toDateKey(new Date(event.endDate)) : startKey
    const effectiveEndKey = endKey >= startKey ? endKey : startKey

    // Skip events entirely outside the visible grid
    if (effectiveEndKey < gridStart || startKey > gridEnd) continue

    // Clamp iteration to grid bounds
    const clampedStart = startKey < gridStart ? gridStart : startKey
    const clampedEnd = effectiveEndKey > gridEnd ? gridEnd : effectiveEndKey

    const current = new Date(clampedStart + 'T00:00:00')
    const end = new Date(clampedEnd + 'T00:00:00')
    while (current <= end) {
      const key = toDateKey(current)
      const existing = dots.get(key) || { count: 0, formats: [] }
      existing.count++
      if (event.format && !existing.formats.includes(event.format)) {
        existing.formats.push(event.format)
      }
      dots.set(key, existing)
      current.setDate(current.getDate() + 1)
    }
  }
  return dots
}

export function EventsPageClient({ events, locale, hasNextPage }: EventsPageClientProps) {
  const t = useTranslations('events')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Load more state
  const [page, setPage] = useState(2)
  const [extraEvents, setExtraEvents] = useState<Event[]>([])
  const [hasMore, setHasMore] = useState(hasNextPage)
  const [isPending, startTransition] = useTransition()

  // Initialize state from URL params
  const [currentMonth, setCurrentMonth] = useState(() => {
    const dateParam = searchParams.get('date')
    if (dateParam) {
      const parsed = new Date(dateParam)
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1)
      }
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const dateParam = searchParams.get('date')
    if (dateParam) {
      const parsed = new Date(dateParam)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return null
  })

  const [filters, setFilters] = useState({
    format: searchParams.get('format') || '',
    location: searchParams.get('location') || '',
  })

  const [showPast, setShowPast] = useState(false)

  // Combine initial + loaded events
  const allEvents = useMemo(
    () => [...events, ...extraEvents],
    [events, extraEvents],
  )

  function handleLoadMore() {
    startTransition(async () => {
      const { docs, hasNextPage: more } = await loadMoreEvents(locale, page)
      setExtraEvents((prev) => [...prev, ...(docs as Event[])])
      setHasMore(more ?? false)
      setPage((p) => p + 1)
    })
  }

  // Update URL when state changes (debounced)
  const updateUrl = useCallback(
    (newFilters: typeof filters, newDate: Date | null) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams()
        if (newFilters.format) params.set('format', newFilters.format)
        if (newFilters.location) params.set('location', newFilters.location)
        if (newDate) params.set('date', toDateKey(newDate))
        const qs = params.toString()
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
      }, 300)
    },
    [router, pathname],
  )

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value }
        updateUrl(newFilters, selectedDate)
        return newFilters
      })
    },
    [selectedDate, updateUrl],
  )

  const handleClearFilters = useCallback(() => {
    const newFilters = { format: '', location: '' }
    setFilters(newFilters)
    setSelectedDate(null)
    updateUrl(newFilters, null)
  }, [updateUrl])

  const handleDateSelect = useCallback(
    (date: Date | null) => {
      setSelectedDate(date)
      updateUrl(filters, date)
    },
    [filters, updateUrl],
  )

  // Unique locations from ALL events (unfiltered so options don't disappear)
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>()
    for (const event of allEvents) {
      if (event.location) locs.add(event.location)
    }
    return Array.from(locs).sort()
  }, [allEvents])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (filters.format && event.format !== filters.format) return false
      if (filters.location && event.location !== filters.location) return false
      return true
    })
  }, [allEvents, filters])

  // Split into upcoming / past, sorted by nearest first
  const upcomingEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) => isUpcoming(e))
        .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b)),
    [filteredEvents],
  )
  const pastEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) => !isUpcoming(e))
        .sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a)),
    [filteredEvents],
  )

  // All events for selected date (upcoming + past combined)
  const dateFilteredAll = useMemo(() => {
    if (!selectedDate) return null
    const key = toDateKey(selectedDate)
    return filteredEvents
      .filter((event) => {
        const start = new Date(event.date)
        const end = event.endDate ? new Date(event.endDate) : start
        const effectiveEnd = end >= start ? end : start
        return key >= toDateKey(start) && key <= toDateKey(effectiveEnd)
      })
      .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b))
  }, [selectedDate, filteredEvents])

  // Compute visible 42-day grid range for calendar dots optimization
  const gridBounds = useMemo(() => {
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth()
    const firstDay = new Date(y, m, 1)
    const startDow = (firstDay.getDay() + 6) % 7 // Monday = 0
    const gridStart = new Date(y, m, 1 - startDow)
    const gridEnd = new Date(gridStart)
    gridEnd.setDate(gridEnd.getDate() + 41) // 42 days total
    return { start: toDateKey(gridStart), end: toDateKey(gridEnd) }
  }, [currentMonth])

  // Calendar dots (from filtered events, scoped to visible grid)
  const calendarDots = useMemo(
    () => buildCalendarDots(filteredEvents, gridBounds.start, gridBounds.end),
    [filteredEvents, gridBounds],
  )

  const hasActiveFilters = filters.format !== '' || filters.location !== '' || selectedDate !== null

  const totalDateFiltered = dateFilteredAll !== null
    ? dateFilteredAll.length
    : upcomingEvents.length + pastEvents.length

  // Format selected date for display
  const selectedDateStr = useMemo(() => {
    if (!selectedDate) return ''
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(selectedDate)
  }, [selectedDate, locale])

  return (
    <div className="mt-12 lg:mt-16">
      <div className="flex flex-col gap-12 lg:gap-16">
        <EventCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          dots={calendarDots}
          locale={locale}
        />

        <div className="min-w-0">
          {allEvents.length > 0 && (
            <EventFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              locations={uniqueLocations}
              hasActiveFilters={hasActiveFilters}
              resultCount={totalDateFiltered}
            />
          )}

          {/* Empty states */}
          {allEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-xl font-heading font-medium text-foreground mb-2">
                {t('noEvents')}
              </h2>
              <p className="text-body-lg text-foreground/50 max-w-md">
                {t('noEventsDescription')}
              </p>
            </div>
          ) : selectedDate && totalDateFiltered === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-xl font-heading font-medium text-foreground mb-3">
                {t('noEventsOnDate', { date: selectedDateStr })}
              </h2>
              <button
                onClick={() => handleDateSelect(null)}
                className="text-[11px] uppercase tracking-[0.15em] font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                {t('showAllEvents')}
              </button>
            </div>
          ) : hasActiveFilters && filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h2 className="text-xl font-heading font-medium text-foreground mb-3">
                {t('noMatchingEvents')}
              </h2>
              <button
                onClick={handleClearFilters}
                className="text-[11px] uppercase tracking-[0.15em] font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                {t('clearFilters')}
              </button>
            </div>
          ) : selectedDate && dateFilteredAll !== null ? (
            // Selected date: show all events for that date
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-6">
                {selectedDateStr} ({dateFilteredAll.length})
              </h2>
              <ul
                className="grid grid-cols-1 md:grid-cols-2 gap-8 list-none p-0"
                role="list"
              >
                {dateFilteredAll.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <>
              {/* Upcoming events */}
              {upcomingEvents.length > 0 ? (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-6">
                    {t('upcoming')} ({upcomingEvents.length})
                  </h2>
                  <ul
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 list-none p-0"
                    role="list"
                  >
                    {upcomingEvents.map((event) => (
                      <li key={event.id}>
                        <EventCard event={event} locale={locale} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="text-body-lg text-foreground/50 mb-10">
                  {t('noEvents')}
                </p>
              )}

              {/* Past events */}
              {pastEvents.length > 0 && (
                <section className="mt-12">
                  <button
                    onClick={() => setShowPast(!showPast)}
                    className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-6 hover:text-foreground transition-colors"
                    aria-expanded={showPast}
                  >
                    {showPast ? t('hidePast') : t('showPast')} ({pastEvents.length})
                  </button>
                  {showPast && (
                    <ul
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 list-none p-0 mt-4"
                      role="list"
                    >
                      {pastEvents.map((event) => (
                        <li key={event.id}>
                          <EventCard event={event} locale={locale} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          )}

          {/* Load more button */}
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isPending}
                aria-busy={isPending}
                className="border border-foreground/[0.08] bg-surface px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.4em] text-foreground transition-colors hover:border-foreground/[0.15] disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px]"
              >
                {isPending ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
