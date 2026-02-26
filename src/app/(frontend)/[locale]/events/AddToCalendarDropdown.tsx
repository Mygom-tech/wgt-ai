'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { Event } from '@/payload-types'

type AddToCalendarDropdownProps = {
  event: Event
}

function fmtGCal(dateStr: string, timeStr: string | null | undefined): string {
  const date = new Date(dateStr)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')

  if (!timeStr) return `${y}${m}${d}`

  const time = new Date(timeStr)
  const hh = String(time.getUTCHours()).padStart(2, '0')
  const mm = String(time.getUTCMinutes()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}00`
}

function buildGoogleCalendarURL(event: Event): string {
  const startDate = fmtGCal(event.date, event.timeFrom)
  const endDate = fmtGCal(
    event.endDate || event.date,
    event.timeTo || event.timeFrom,
  )

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
  })

  if (event.location) params.set('location', event.location)
  if (event.excerpt) params.set('details', event.excerpt)
  if (event.timeZone) params.set('ctz', event.timeZone)

  return `https://calendar.google.com/calendar/render?${params}`
}

export function AddToCalendarDropdown({ event }: AddToCalendarDropdownProps) {
  const t = useTranslations('events')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const googleCalUrl = buildGoogleCalendarURL(event)

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="text-[11px] uppercase tracking-[0.15em] font-semibold text-primary hover:text-primary/70 transition-colors"
      >
        {t('addToCalendar')}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 bg-surface border border-foreground/10 rounded-sm shadow-lg py-1 min-w-[180px] z-20"
        >
          <a
            role="menuitem"
            href={googleCalUrl}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="block px-4 py-2 text-sm text-foreground hover:bg-background transition-colors"
          >
            {t('googleCalendar')}
          </a>
          <a
            role="menuitem"
            href={`/api/events/${event.slug}/calendar`}
            download
            onClick={(e) => e.stopPropagation()}
            className="block px-4 py-2 text-sm text-foreground hover:bg-background transition-colors"
          >
            {t('downloadIcs')}
          </a>
        </div>
      )}
    </div>
  )
}
