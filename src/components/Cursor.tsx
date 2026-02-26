'use client'

import { useRef, useEffect } from 'react'
import { gsap } from '@/lib/gsap'

export function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const follower = followerRef.current
    if (!cursor || !follower) return

    // Don't show on touch devices
    if ('ontouchstart' in window) return

    // Initial hidden state
    gsap.set([cursor, follower], { opacity: 0 })

    // Ultra-smooth tracking
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3.out' })
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3.out' })
    
    const fxTo = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3.out' })
    const fyTo = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3.out' })

    let isVisible = false

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        gsap.to([cursor, follower], { opacity: 1, duration: 0.5 })
        isVisible = true
      }
      xTo(e.clientX)
      yTo(e.clientY)
      fxTo(e.clientX)
      fyTo(e.clientY)
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest('a, button, [data-magnetic]')

      if (isInteractive) {
        gsap.to(cursor, { scale: 0, duration: 0.3 })
        gsap.to(follower, {
          scale: 2,
          borderColor: 'rgba(0,128,128,0.5)',
          backgroundColor: 'rgba(0,128,128,0.07)',
          mixBlendMode: 'normal',
          duration: 0.4,
          ease: 'back.out(1.7)',
        })
      }
    }

    const handleMouseLeave = () => {
      gsap.to(cursor, { scale: 1, duration: 0.3 })
      gsap.to(follower, {
        scale: 1,
        borderColor: 'white',
        backgroundColor: 'transparent',
        mixBlendMode: 'difference',
        duration: 0.4,
        ease: 'power2.out'
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseover', handleMouseEnter)
    document.addEventListener('mouseout', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseover', handleMouseEnter)
      document.removeEventListener('mouseout', handleMouseLeave)
    }
  }, [])

  return (
    <>
      {/* Precision Center Dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-1 h-1 -ml-[2px] -mt-[2px] bg-white rounded-full pointer-events-none z-[99999] mix-blend-difference hidden lg:block"
      />
      {/* Fluid Follower Ring */}
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-white pointer-events-none z-[99998] mix-blend-difference hidden lg:block"
      />
    </>
  )
}
