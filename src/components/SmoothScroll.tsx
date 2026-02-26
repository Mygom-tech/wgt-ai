'use client'

import { ReactLenis, useLenis } from 'lenis/react'
import 'lenis/dist/lenis.css'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function ScrollToTop() {
  const lenis = useLenis()
  const pathname = usePathname()

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      let attempts = 0
      const maxAttempts = 10
      let timer: ReturnType<typeof setTimeout> | null = null

      function tryScroll() {
        ScrollTrigger.refresh()
        const target = document.querySelector(hash)
        if (target) {
          lenis?.scrollTo(target as HTMLElement, { offset: -80 })
          return
        }
        // Element not found yet - retry (handles cross-page nav where DOM isn't ready)
        attempts++
        if (attempts < maxAttempts) {
          timer = setTimeout(tryScroll, 100)
        }
      }

      requestAnimationFrame(tryScroll)

      return () => {
        if (timer) clearTimeout(timer)
      }
    } else {
      lenis?.scrollTo(0, { immediate: true })
      requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })
    }
  }, [pathname, lenis])

  return null
}

function GsapBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    lenis.on('scroll', ScrollTrigger.update)

    const update = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      gsap.ticker.remove(update)
    }
  }, [lenis])

  return null
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      autoRaf={false}
      options={{
        lerp: 0.1,
        smoothWheel: true,
        anchors: { offset: -80 },
        syncTouch: false,
        autoResize: true,
        prevent: (node: Element) => node.classList.contains('no-smooth-scroll'),
      }}
    >
      <GsapBridge />
      <ScrollToTop />
      {children}
    </ReactLenis>
  )
}
