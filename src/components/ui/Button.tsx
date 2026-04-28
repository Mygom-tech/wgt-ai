'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'light' | 'cta'
type ButtonSize = 'sm' | 'md' | 'lg' | 'default'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'default', href, className, children, disabled, ...props },
    ref,
  ) {
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      
      // Size variants
      {
        'px-4 py-2 text-xs': size === 'sm',
        'px-6 py-3 text-sm': size === 'default' || size === 'md',
        'px-8 py-4 text-base': size === 'lg',
      },
      
      // Variant styles - Premium Minimalist
      {
        // Primary: Solid Black, White Text
        'bg-[#111111] text-white hover:bg-[#333333] hover:scale-[1.02] active:scale-[0.98]':
          variant === 'primary',
          
        // Secondary: Outline, Black Text
        'bg-transparent border border-[#E5E5E5] text-[#111111] hover:border-[#111111] hover:bg-transparent':
          variant === 'secondary' || variant === 'outline',
          
        // Ghost: Text Only
        'bg-transparent text-[#111111] hover:text-[#666666]':
          variant === 'ghost',

        // Light: Solid White, Black Text - for use on dark backgrounds
        'bg-white text-[#111111] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-white':
          variant === 'light',

        // CTA: Honeysuckle, Black Text - top-priority call to action on light backgrounds
        'bg-secondary text-foreground hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-[0.98]':
          variant === 'cta',
      },
      
      'rounded-full', // Always pill shape for this design system
      className,
    )

    if (href) {
      return (
        <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={baseClasses}>
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClasses}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  },
)