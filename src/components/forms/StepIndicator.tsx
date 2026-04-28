'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { FormVariant } from './styles'

type StepIndicatorProps = {
  steps: Array<{ label?: string | null }>
  current: number
  variant?: FormVariant
}

export function StepIndicator({ steps, current, variant = 'dark' }: StepIndicatorProps) {
  const t = useTranslations('registration')
  const total = steps.length

  return (
    <div
      className="mb-10"
      role="group"
      aria-label={t('stepIndicator', { current: current + 1, total })}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, i) => {
          const isActive = i === current
          const isComplete = i < current
          const isLast = i === total - 1

          const circleClasses = cn(
            'shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[11px] font-semibold transition-colors',
            isComplete && 'bg-primary text-white',
            isActive && 'bg-secondary text-foreground',
            !isActive &&
              !isComplete &&
              (variant === 'dark'
                ? 'bg-white/10 text-white/40'
                : 'bg-foreground/10 text-foreground/40'),
          )

          const labelClasses = cn(
            'text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-semibold whitespace-nowrap',
            isActive
              ? variant === 'dark'
                ? 'text-white'
                : 'text-foreground'
              : variant === 'dark'
                ? 'text-white/40'
                : 'text-foreground/40',
          )

          const connectorClasses = cn(
            'flex-1 h-px transition-colors',
            i < current ? 'bg-primary' : variant === 'dark' ? 'bg-white/10' : 'bg-foreground/10',
          )

          return (
            <div key={i} className={cn('flex items-center gap-2 sm:gap-3', !isLast && 'flex-1')}>
              <div className={circleClasses} aria-current={isActive ? 'step' : undefined}>
                {i + 1}
              </div>
              {step.label ? <span className={labelClasses}>{step.label}</span> : null}
              {!isLast && <div className={connectorClasses} aria-hidden="true" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
