'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

export function Preloader() {
  const [isComplete, setIsComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited')

    const tl = gsap.timeline({
      onComplete: () => {
        setIsComplete(true)
        sessionStorage.setItem('hasVisited', 'true')
        document.body.classList.add('preloader-done')
        window.dispatchEvent(new CustomEvent('preloaderComplete'))
      },
    })

    document.body.style.overflow = 'hidden'

    // ─── Initial States ───
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(counterRef.current, { opacity: 0 })
    gsap.set(containerRef.current, { clipPath: 'inset(0% 0% 0% 0%)' })

    // ─── Counter fade in ───
    tl.to(counterRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
    }, 0)

    // ─── Line fills + counter counts ───
    const duration = hasVisited ? 0.8 : 2.4
    tl.to(lineRef.current, {
      scaleX: 1,
      duration,
      ease: 'power2.inOut',
    }, 0.2)

    tl.to(counterRef.current, {
      textContent: '100',
      duration,
      ease: 'power2.inOut',
      snap: { textContent: 1 },
      onUpdate: function () {
        if (counterRef.current) {
          counterRef.current.textContent = Math.round(
            Number(this.targets()[0].textContent),
          ).toString()
        }
      },
    }, 0.2)

    // ─── Exit ───
    tl.addLabel('exitStart', '+=0.3')

    // Loader fades out
    const loaderEl = counterRef.current?.closest('[data-loader]')
    if (loaderEl) {
      tl.to(loaderEl, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
      }, 'exitStart')
    }

    // Clip up to reveal hero
    tl.to(containerRef.current, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 1.2,
      ease: 'power4.inOut',
    }, 'exitStart+=0.2')

    // Fire hero/header entrance while preloader is mid-clip
    tl.add(() => {
      window.dispatchEvent(new CustomEvent('preloaderStartExit'))
      document.body.style.overflow = ''
      // Recalculate all ScrollTrigger positions after overflow is restored
      ScrollTrigger.refresh()
    }, 'exitStart+=0.6')

    return () => {
      tl.kill()
      document.body.style.overflow = ''
    }
  }, [])

  if (isComplete) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
    >
      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-grain mix-blend-multiply" />

      {/* Minimal loader - line + counter */}
      <div data-loader className="relative z-10 flex flex-col items-center gap-6">
        {/* Progress line */}
        <div className="w-[200px] sm:w-[260px] h-[1px] bg-foreground/10 relative">
          <div
            ref={lineRef}
            className="absolute inset-0 bg-primary origin-left"
          />
        </div>

        {/* Counter */}
        <div className="flex items-baseline gap-1">
          <span
            ref={counterRef}
            className="font-heading text-sm font-medium tracking-[0.3em] text-foreground/40 tabular-nums"
          >
            0
          </span>
          <span className="text-xs font-medium text-primary/60">%</span>
        </div>
      </div>
    </div>
  )
}
