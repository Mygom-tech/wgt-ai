'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { RichTextRenderer, type LexicalRootData } from '@/components/RichTextRenderer'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import type { Image as PayloadImage } from '@/payload-types'

type EditorialSectionProps = {
  id: string
  eyebrow: string
  heading: string
  body: LexicalRootData | null | undefined
  image?: PayloadImage | null
  backgroundWord: string
  sectionIndex?: string
  className?: string
  footer?: ReactNode
}

export function EditorialSection({
  id,
  eyebrow,
  heading,
  body,
  image,
  backgroundWord,
  sectionIndex = '02',
  className,
  footer,
}: EditorialSectionProps) {
  const containerRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const bgEl = container.querySelector('[data-editorial-bg]')
      const imageEl = container.querySelector('[data-editorial-image]')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(imageRef.current, { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' })
        gsap.set(container.querySelectorAll('[data-editorial-reveal]'), { opacity: 1, y: 0 })
        return
      }

      // Enter animation timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      })

      tl.from(
        imageRef.current,
        {
          scale: 1.05,
          clipPath: 'inset(100% 0% 0% 0%)',
          duration: 1.4,
          ease: 'power4.inOut',
        },
        0,
      )

      // Content elements rise into place with tight stagger
      tl.from(
        container.querySelectorAll('[data-editorial-reveal]'),
        {
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 1.0,
          ease: 'power3.out',
        },
        0.3,
      )

      // Single ScrollTrigger for both scrub animations (background text + image parallax)
      ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          // Background text slides in from left (-20% → 0%)
          if (bgEl) {
            gsap.set(bgEl, { xPercent: -20 + 20 * self.progress, opacity: self.progress })
          }
          // Image parallax (0% → 15%)
          if (imageEl) {
            gsap.set(imageEl, { yPercent: 15 * self.progress })
          }
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <Section
      ref={containerRef}
      id={id}
      aria-labelledby={`${id}-heading`}
      variant="light"
      className={className}
    >
      <GridLines columns={16} rows={12} className="opacity-40" />

      <div
        className="absolute top-[10%] left-[-5%] whitespace-nowrap pointer-events-none select-none z-0"
        aria-hidden="true"
        data-nosnippet
      >
        <span
          data-editorial-bg
          className="text-[clamp(10rem,25vw,30rem)] font-black uppercase text-foreground/[0.08] tracking-[-0.05em] leading-none"
        >
          {backgroundWord}
        </span>
      </div>

      <Container size="xl" className="relative z-10">
        <div className="relative flex flex-col lg:flex-row items-end gap-20 lg:gap-0">
          {/* Image */}
          <div className="w-full lg:w-[55%] relative z-10">
            <div
              ref={imageRef}
              className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden shadow-2xl rounded-[2px]"
            >
              <div data-editorial-image className="absolute inset-x-0 -inset-y-[15%]">
                {image?.url ? (
                  <Image
                    src={image.url}
                    alt={image.alt || heading}
                    fill
                    className="object-cover grayscale-[30%] contrast-[1.1] brightness-[0.95]"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-border to-background" />
                )}
              </div>
              <div className="absolute inset-0 border-[30px] border-white/5 pointer-events-none" />
            </div>
          </div>

          {/* Editorial content */}
          <div className="w-full lg:w-[50%] lg:-ml-[10vw] mb-[5vh] lg:mb-[10vh] relative z-20 flex flex-col items-start">
            <div className="bg-surface p-8 lg:p-14 shadow-xl rounded-[2px] border border-foreground/5 flex flex-col gap-8">
              {/* Eyebrow + heading */}
              <div data-editorial-reveal className="flex flex-col gap-4">
                <Eyebrow label={eyebrow} />
                <h2
                  id={`${id}-heading`}
                  className="text-[clamp(1.25rem,3vw,2.25rem)] font-medium uppercase leading-[1.05] tracking-[-0.02em] font-heading text-foreground"
                >
                  {heading}
                </h2>
              </div>

              {/* Body */}
              <div data-editorial-reveal className="flex flex-col gap-6">
                <div className="w-full h-[1px] bg-foreground/10" />
                <RichTextRenderer
                  data={body}
                  className="text-sm lg:text-[0.95rem] font-normal text-foreground/70 leading-[1.7] tracking-normal space-y-4"
                />
              </div>

              {/* Optional extensibility slot */}
              {footer && <div data-editorial-reveal>{footer}</div>}

              {/* Decorative footer */}
              <div
                data-editorial-reveal
                aria-hidden="true"
                className="flex items-center justify-between pt-3 border-t border-foreground/5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/20">
                  {sectionIndex}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
