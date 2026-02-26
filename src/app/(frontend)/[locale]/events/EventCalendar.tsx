'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type CalendarDay = {
  date: Date
  number: number
  isCurrentMonth: boolean
}

type CalendarDot = {
  count: number
  formats: string[]
}

type EventCalendarProps = {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  dots: Map<string, CalendarDot>
  locale: string
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const dotColorMap: Record<string, string> = {
  'in-person': 'bg-primary',
  online: 'bg-accent',
  hybrid: 'bg-[#3B47FF]',
}

function buildCalendarGrid(year: number, month: number): CalendarDay[][] {
  const firstDay = new Date(year, month, 1)
  // Monday = 0 (EU standard)
  const startDow = (firstDay.getDay() + 6) % 7
  const startDate = new Date(year, month, 1 - startDow)

  // Always 6 weeks for consistent height
  const weeks: CalendarDay[][] = []
  const current = new Date(startDate)
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = []
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(current),
        number: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
      })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function EventCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  dots,
  locale,
}: EventCalendarProps) {
  const t = useTranslations('events')
  const gridRef = useRef<HTMLDivElement>(null)
  const [focusedDate, setFocusedDate] = useState<Date | null>(null)
  const today = useMemo(() => new Date(), [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const weeks = useMemo(() => buildCalendarGrid(year, month), [year, month])

  const dayNames = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, i + 1) // Jan 1 2024 = Monday
        return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
      }),
    [locale],
  )

  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        currentMonth,
      ),
    [locale, currentMonth],
  )

  const prevMonth = useCallback(() => {
    onMonthChange(new Date(year, month - 1, 1))
  }, [year, month, onMonthChange])

  const nextMonth = useCallback(() => {
    onMonthChange(new Date(year, month + 1, 1))
  }, [year, month, onMonthChange])

  const toggleDate = useCallback(
    (date: Date) => {
      if (selectedDate && isSameDay(selectedDate, date)) {
        onDateSelect(null)
      } else {
        onDateSelect(date)
      }
    },
    [selectedDate, onDateSelect],
  )

  const navigateToDate = useCallback(
    (newDate: Date) => {
      if (newDate.getMonth() !== month || newDate.getFullYear() !== year) {
        onMonthChange(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
      }
      setFocusedDate(newDate)
      // Focus the button for the new date after render
      requestAnimationFrame(() => {
        const key = toDateKey(newDate)
        const btn = gridRef.current?.querySelector(
          `[data-date="${key}"]`,
        ) as HTMLButtonElement | null
        btn?.focus()
      })
    },
    [month, year, onMonthChange],
  )

  const handleCalendarKeyDown = useCallback(
    (e: React.KeyboardEvent, day: CalendarDay) => {
      const d = day.date
      let newDate: Date | null = null

      switch (e.key) {
        case 'ArrowUp':
          newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
          break
        case 'ArrowDown':
          newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
          break
        case 'ArrowLeft':
          newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
          break
        case 'ArrowRight':
          newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
          break
        case 'Home':
          // First day of week (Monday)
          newDate = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate() - ((d.getDay() + 6) % 7),
          )
          break
        case 'End':
          // Last day of week (Sunday)
          newDate = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate() + (6 - ((d.getDay() + 6) % 7)),
          )
          break
        case 'PageUp':
          newDate = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate())
          break
        case 'PageDown':
          newDate = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          toggleDate(d)
          return
        default:
          return
      }

      if (newDate) {
        e.preventDefault()
        navigateToDate(newDate)
      }
    },
    [toggleDate, navigateToDate],
  )

  // Determine which date should have tabIndex=0 (roving tabindex)
  const focusTarget = focusedDate || selectedDate || today

  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-surface p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-6 lg:mb-8">
        <button
          onClick={prevMonth}
          aria-label={t('previousMonth')}
          className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-xl lg:text-2xl font-heading font-medium capitalize">
          {monthName}
        </span>
        <button
          onClick={nextMonth}
          aria-label={t('nextMonth')}
          className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <div ref={gridRef} role="grid" aria-label={`${monthName} calendar`}>
        <div role="row" className="grid grid-cols-7 mb-3 lg:mb-4">
          {dayNames.map((day) => (
            <div
              key={day}
              role="columnheader"
              className="text-center text-xs sm:text-sm font-medium text-muted uppercase tracking-wide py-2"
            >
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7">
            {week.map((day) => {
              const key = toDateKey(day.date)
              const dot = dots.get(key)
              const isToday = isSameDay(day.date, today)
              const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false
              const isFocusTarget = isSameDay(day.date, focusTarget)
              const dotFormats = dot ? dot.formats.slice(0, 3) : []

              const dateLabel = new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(day.date)

              return (
                <button
                  key={key}
                  role="gridcell"
                  data-date={key}
                  aria-label={`${dateLabel}. ${dot ? dot.count : 0} events`}
                  aria-current={isToday ? 'date' : undefined}
                  aria-selected={isSelected || undefined}
                  tabIndex={isFocusTarget ? 0 : -1}
                  onKeyDown={(e) => handleCalendarKeyDown(e, day)}
                  onClick={() => toggleDate(day.date)}
                  className={cn(
                    'relative flex flex-col items-center min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[3.5rem] py-1.5 sm:py-2 lg:py-2.5 text-sm sm:text-base transition-colors border-t border-foreground/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    !day.isCurrentMonth && 'text-foreground/20',
                    day.isCurrentMonth && 'text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors',
                      isToday &&
                        !isSelected &&
                        'bg-foreground text-surface',
                      isSelected &&
                        !isToday &&
                        'bg-foreground/10 ring-1 ring-foreground/20',
                      isSelected &&
                        isToday &&
                        'bg-foreground text-surface ring-2 ring-offset-2',
                    )}
                  >
                    {day.number}
                  </span>
                  {dotFormats.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {dotFormats.map((format, i) => (
                        <span
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            dotColorMap[format] || 'bg-muted',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
