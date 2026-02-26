'use client'

import { useTranslations } from 'next-intl'

type EventFiltersProps = {
  filters: { format: string; location: string }
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  locations: string[]
  hasActiveFilters: boolean
  resultCount: number
}

const selectClassName =
  "border border-foreground/10 bg-surface px-5 py-3 text-sm text-foreground appearance-none rounded-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors pr-10 bg-no-repeat bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[right_12px_center] bg-[length:10px]"

export function EventFilters({
  filters,
  onFilterChange,
  onClearFilters,
  locations,
  hasActiveFilters,
  resultCount,
}: EventFiltersProps) {
  const t = useTranslations('events')

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-4 mb-8"
        role="search"
        aria-label="Filter events"
      >
        <select
          value={filters.format}
          onChange={(e) => onFilterChange('format', e.target.value)}
          className={selectClassName}
          aria-label={t('filterFormat')}
        >
          <option value="">{t('filterAll')} - {t('filterFormat')}</option>
          <option value="in-person">{t('inPerson')}</option>
          <option value="online">{t('online')}</option>
          <option value="hybrid">{t('hybrid')}</option>
        </select>

        <select
          value={filters.location}
          onChange={(e) => onFilterChange('location', e.target.value)}
          className={selectClassName}
          aria-label={t('filterLocation')}
        >
          <option value="">{t('filterAll')} - {t('filterLocation')}</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-[11px] uppercase tracking-[0.15em] font-semibold text-primary hover:text-primary/70 transition-colors"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>
      <div aria-live="polite" className="sr-only">
        {t('eventCount', { count: resultCount })}
      </div>
    </>
  )
}
