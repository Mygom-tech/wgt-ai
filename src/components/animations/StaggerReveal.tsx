'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type StaggerRevealProps = {
  children: React.ReactNode
  className?: string
  stagger?: number
  y?: number
  duration?: number
  delay?: number
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.1,
  y = 40,
  duration = 0.4,
  delay = 0,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(ref.current!.children, { opacity: 1, y: 0 })
        return
      }

      gsap.from(ref.current!.children, {
        y,
        opacity: 0,
        duration,
        stagger,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 75%',
          once: true,
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
