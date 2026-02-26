'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type ProgressLineProps = {
  className?: string
  color?: string
  duration?: number
}

export function ProgressLine({ className, color = 'bg-primary-400', duration = 0.8 }: ProgressLineProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(ref.current, { scaleX: 1, scaleY: 1 })
        return
      }

      const isDesktop = window.matchMedia('(min-width: 1024px)').matches

      gsap.from(ref.current, {
        [isDesktop ? 'scaleX' : 'scaleY']: 0,
        duration,
        ease: 'power2.inOut',
        transformOrigin: isDesktop ? 'left center' : 'center top',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 70%',
          once: true,
        },
      })
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      className={cn(
        'hidden lg:block lg:h-[2px] lg:w-full',
        'max-lg:block max-lg:mx-auto max-lg:h-full max-lg:w-[2px]',
        color,
        className,
      )}
      aria-hidden="true"
    />
  )
}
