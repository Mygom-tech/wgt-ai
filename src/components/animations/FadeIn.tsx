'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type FadeInProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
  once?: boolean
  trigger?: 'scroll' | 'load'
  scale?: number
  ease?: string
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  y = 30,
  once = true,
  trigger = 'scroll',
  scale,
  ease = 'power2.out',
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(ref.current, { opacity: 1, y: 0 })
        return
      }

      const fromVars: gsap.TweenVars = {
        y,
        opacity: 0,
        duration,
        delay,
        ease,
      }

      if (scale !== undefined) {
        fromVars.scale = scale
      }

      if (trigger === 'scroll') {
        fromVars.scrollTrigger = {
          trigger: ref.current,
          start: 'top 80%',
          once,
        }
      }

      gsap.from(ref.current, fromVars)
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  )
}
