'use client'

import { useRef, useState } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type CounterAnimationProps = {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

export function CounterAnimation({
  value,
  duration = 1.2,
  prefix = '',
  suffix = '',
  className,
  decimals = 0,
}: CounterAnimationProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [displayValue, setDisplayValue] = useState(0)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplayValue(value)
        return
      }

      const obj = { val: 0 }
      gsap.to(obj, {
        val: value,
        duration,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 75%',
          once: true,
        },
        onUpdate: () => {
          setDisplayValue(Number(obj.val.toFixed(decimals)))
        },
      })
    },
    { scope: ref },
  )

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}
