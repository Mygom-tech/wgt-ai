import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/utils'

type SectionVariant = 'light' | 'white' | 'dark'

type SectionProps = ComponentPropsWithRef<'section'> & {
  variant?: SectionVariant
  noPadding?: boolean
}

const variantStyles: Record<SectionVariant, string> = {
  light: 'bg-background text-foreground',
  white: 'bg-surface text-foreground',
  dark: 'bg-[#111111] text-white',
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, variant = 'light', noPadding = false, ...rest }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden',
          variantStyles[variant],
          !noPadding && 'py-section',
          className,
        )}
        {...rest}
      >
        {children}
      </section>
    )
  },
)

Section.displayName = 'Section'
