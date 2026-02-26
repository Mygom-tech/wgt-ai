'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'none'
  stagger?: number
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  stagger = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return

      const els = stagger
        ? ref.current.querySelectorAll('[data-reveal]')
        : [ref.current]

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(els, { opacity: 1, y: 0 })
        return
      }

      gsap.from(els, {
        y: direction === 'up' ? 30 : 0,
        opacity: 0,
        stagger: stagger || 0,
        duration: 1.0,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  )
}
