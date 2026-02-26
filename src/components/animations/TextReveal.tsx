'use client'

import { useRef } from 'react'
import { gsap, useGSAP, SplitText } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type TextRevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  stagger?: number
  duration?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
  trigger?: 'scroll' | 'load'
  highlightLastWord?: boolean
  highlightColor?: string
}

export function TextReveal({
  children,
  className,
  delay = 0,
  stagger = 0.08,
  duration = 0.6,
  as: Component = 'div',
  trigger = 'scroll',
  highlightLastWord = false,
  highlightColor = 'oklch(0.64 0.17 25)',
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!textRef.current) return

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const isMobile = window.innerWidth < 640
      const splitType = isMobile ? 'lines' : 'words'
      const effectiveStagger = isMobile ? 0.05 : stagger

      const split = SplitText.create(textRef.current, {
        type: splitType,
        wordsClass: 'overflow-hidden inline-block',
        linesClass: 'overflow-hidden',
      })

      const elements = isMobile ? split.lines : split.words

      const fromVars: gsap.TweenVars = {
        yPercent: 100,
        duration,
        stagger: effectiveStagger,
        delay,
        ease: 'power3.out',
      }

      if (trigger === 'scroll') {
        fromVars.scrollTrigger = {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        }
      }

      gsap.from(elements, fromVars)

      if (highlightLastWord && split.words.length > 0) {
        const lastWord = split.words[split.words.length - 1]
        gsap.to(lastWord, {
          color: highlightColor,
          duration: 0.4,
          ease: 'power2.out',
          delay: delay + elements.length * effectiveStagger + duration + 0.15,
        })
      }
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)}>
      <Component ref={textRef as React.Ref<never>} className="will-change-transform">
        {children}
      </Component>
    </div>
  )
}
