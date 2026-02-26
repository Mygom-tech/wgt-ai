'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { useRef } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Skip on initial load - preloader handles the reveal
    if (!document.body.classList.contains('preloader-done')) return

    // Subsequent navigations get a simple fade entrance
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
    )
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="min-h-screen">
      {children}
    </div>
  )
}
