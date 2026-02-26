'use client'

import { useRef, useEffect } from 'react'
import { gsap } from '@/lib/gsap'
import { motion } from '@/lib/motionTokens'

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if ('ontouchstart' in window) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const parent = el.parentElement
    if (!parent) return

    const xTo = gsap.quickTo(el, 'left', {
      duration: motion.interaction.cursorGlowLag,
      ease: 'power2.out',
    })
    const yTo = gsap.quickTo(el, 'top', {
      duration: motion.interaction.cursorGlowLag,
      ease: 'power2.out',
    })

    const handleMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      xTo(e.clientX - rect.left)
      yTo(e.clientY - rect.top)
      el.style.opacity = '1'
    }

    const handleLeave = () => {
      el.style.opacity = '0'
    }

    parent.addEventListener('mousemove', handleMove)
    parent.addEventListener('mouseleave', handleLeave)

    return () => {
      parent.removeEventListener('mousemove', handleMove)
      parent.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  const size = motion.interaction.cursorGlowSize

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-[5] rounded-full opacity-0 transition-opacity duration-500"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        background: `radial-gradient(circle, oklch(0.53 0.11 195 / ${motion.interaction.cursorGlowOpacity}) 0%, transparent 70%)`,
      }}
      aria-hidden="true"
    />
  )
}
