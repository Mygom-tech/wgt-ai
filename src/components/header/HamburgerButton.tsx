'use client'

import { cn } from '@/lib/utils'

type HamburgerButtonProps = {
  isOpen: boolean
  onToggle: () => void
  openLabel: string
  closeLabel: string
  className?: string
}

export function HamburgerButton({
  isOpen,
  onToggle,
  openLabel,
  closeLabel,
  className,
}: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? closeLabel : openLabel}
      aria-expanded={isOpen}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
        'rounded-md',
        className,
      )}
    >
      <div className="flex h-4 w-6 flex-col justify-between">
        <span
          className={cn(
            'block h-[2px] w-6 rounded-full bg-foreground transition-all duration-300 ease-in-out',
            isOpen && 'translate-y-[7px] rotate-45',
          )}
        />
        <span
          className={cn(
            'block h-[2px] w-6 rounded-full bg-foreground transition-all duration-300 ease-in-out',
            isOpen && 'opacity-0',
          )}
        />
        <span
          className={cn(
            'block h-[2px] w-6 rounded-full bg-foreground transition-all duration-300 ease-in-out',
            isOpen && '-translate-y-[7px] -rotate-45',
          )}
        />
      </div>
    </button>
  )
}
