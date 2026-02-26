import { cn } from '@/lib/utils'

const lineColorMap = {
  primary: 'bg-primary',
  foreground: 'bg-foreground',
  white: 'bg-white',
} as const

const textColorMap = {
  primary: 'text-primary',
  foreground: 'text-foreground',
  white: 'text-white',
} as const

type EyebrowProps = {
  label: string
  color?: keyof typeof lineColorMap
  /** 'line' renders a horizontal rule before the label, 'dot' renders a small circle */
  variant?: 'line' | 'dot'
  className?: string
}

export function Eyebrow({ label, color = 'primary', variant = 'line', className }: EyebrowProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {variant === 'dot' ? (
        <span className={cn('w-1.5 h-1.5 rounded-full', lineColorMap[color])} />
      ) : (
        <div className={cn('w-8 h-[1px]', lineColorMap[color])} />
      )}
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-[0.4em]',
          textColorMap[color],
        )}
      >
        {label}
      </span>
    </div>
  )
}
