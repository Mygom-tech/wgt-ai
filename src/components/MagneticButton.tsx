'use client'

import React, { useRef, useEffect } from 'react'
import { gsap } from '@/lib/gsap'

type MagneticButtonProps = {
  children: React.ReactElement
  className?: string
  strength?: number 
  innerStrength?: number
}

export function MagneticButton({
  children,
  className,
  strength = 0.35,
  innerStrength = 0.2
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // QuickTo for high-performance following
    const xTo = gsap.quickTo(el, 'x', { duration: 1, ease: 'power4.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 1, ease: 'power4.out' })
    
    // Also move the internal element slightly less for depth
    const inner = el.querySelector(':first-child')
    const innerXTo = inner ? gsap.quickTo(inner, 'x', { duration: 1, ease: 'power4.out' }) : null
    const innerYTo = inner ? gsap.quickTo(inner, 'y', { duration: 1, ease: 'power4.out' }) : null

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { left, top, width, height } = el.getBoundingClientRect()
      const centerX = left + width / 2
      const centerY = top + height / 2
      
      const distanceX = clientX - centerX
      const distanceY = clientY - centerY
      
      xTo(distanceX * strength)
      yTo(distanceY * strength)
      
      if (innerXTo && innerYTo) {
        innerXTo(distanceX * innerStrength)
        innerYTo(distanceY * innerStrength)
      }
    }

    const handleMouseLeave = () => {
      xTo(0)
      yTo(0)
      if (innerXTo && innerYTo) {
        innerXTo(0)
        innerYTo(0)
      }
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength, innerStrength])

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      {children}
    </div>
  )
}

// Helper for cn since it's used above
import { cn } from '@/lib/utils'
