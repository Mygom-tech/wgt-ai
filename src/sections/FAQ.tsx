'use client'

import { useRef, useState, useEffect } from 'react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { RichTextRenderer, type LexicalRootData } from '@/components/RichTextRenderer'
import { gsap, useGSAP } from '@/lib/gsap'
import type { FaqItem } from '@/payload-types'

type FAQProps = {
  eyebrow?: string | null
  heading: string
  subtitle?: string | null
  backgroundWord?: string | null
  items: FaqItem[]
}

export function FAQ({ eyebrow, heading, subtitle, backgroundWord, items }: FAQProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const prevIndexRef = useRef<number | null>(null)

  function toggleItem(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const words = sectionRef.current.querySelectorAll('[data-faq-word]')
      const faqItems = sectionRef.current.querySelectorAll('[data-faq-item]')

      if (prefersReduced) {
        gsap.set(words, { opacity: 1, y: 0 })
        gsap.set(faqItems, { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
        },
      })

      // Word-level stagger (fits narrow grid column)
      if (words.length) {
        tl.from(
          words,
          {
            y: 30,
            opacity: 0,
            stagger: 0.08,
            duration: 1.0,
            ease: 'power3.out',
          },
          0,
        )
      }

      // Stagger-reveal FAQ items
      if (faqItems.length) {
        tl.from(
          faqItems,
          {
            y: 30,
            opacity: 0,
            stagger: 0.1,
            duration: 1.0,
            ease: 'power3.out',
          },
          0.3,
        )
      }
    },
    { scope: sectionRef },
  )

  // Accordion open/close animation (only animate the 2 affected panels)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prev = prevIndexRef.current

    // Close previous panel
    if (prev !== null && prev !== openIndex) {
      const closing = panelRefs.current[prev]
      if (closing) {
        if (prefersReduced) {
          gsap.set(closing, { height: 0, opacity: 0 })
          closing.hidden = true
        } else {
          gsap.to(closing, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.inOut',
            overwrite: true,
            onComplete: () => {
              closing.hidden = true
            },
          })
        }
      }
    }

    // Open new panel
    if (openIndex !== null) {
      const opening = panelRefs.current[openIndex]
      if (opening) {
        opening.hidden = false
        if (prefersReduced) {
          gsap.set(opening, { height: 'auto', opacity: 1 })
        } else {
          // Measure natural height, then animate to it
          gsap.set(opening, { height: 'auto' })
          const naturalHeight = opening.offsetHeight
          gsap.set(opening, { height: 0, opacity: 0 })
          gsap.to(opening, {
            height: naturalHeight,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.inOut',
            overwrite: true,
            onComplete: () => {
              gsap.set(opening, { height: 'auto' }) // Reset for responsive
            },
          })
        }
      }
    }

    prevIndexRef.current = openIndex
  }, [openIndex])

  if (!items.length) return null

  return (
    <Section ref={sectionRef} id="faq" aria-labelledby="faq-heading" variant="light">
      <GridLines columns={16} rows={12} className="opacity-40" />

      {/* Background watermark -- positioned at section level for full width */}
      {backgroundWord && (
        <div
          className="absolute bottom-[5%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
          aria-hidden="true"
          data-nosnippet
        >
          <span
            className="font-heading font-black uppercase text-foreground/[0.03] tracking-[-0.05em] leading-none"
            style={{ fontSize: 'clamp(10rem, 25vw, 30rem)' }}
          >
            {backgroundWord}
          </span>
        </div>
      )}

      <Container size="xl" className="relative z-10">
        <div className="lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* --- Left column: Header (sticky on desktop) --- */}
          <header ref={headerRef} className="flex flex-col gap-5 lg:gap-6 mb-12 lg:mb-0 lg:sticky lg:top-32 lg:self-start">
            {eyebrow && <Eyebrow label={eyebrow} color="primary" />}

            <h2
              id="faq-heading"
              className="text-[clamp(2.5rem,6vw,5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-foreground"
            >
              {heading.split(' ').map((word, i) => (
                <span key={i} data-faq-word className="inline-block mr-[0.25em]">
                  {word}
                </span>
              ))}
            </h2>

            {subtitle && (
              <>
                <hr className="w-full h-[1px] bg-foreground/10 border-none" />
                <p className="text-body-lg font-medium text-foreground/60 leading-relaxed tracking-tight max-w-xl">
                  {subtitle}
                </p>
              </>
            )}
          </header>

          {/* --- Right column: Numbered accordion --- */}
          <div>
            {items.map((item, index) => {
              const isOpen = openIndex === index
              const isLast = index === items.length - 1

              return (
                <div
                  key={item.id}
                  className={`border-t border-foreground/10${isLast ? ' border-b' : ''}`}
                  data-faq-item
                >
                  <h3>
                    <button
                      id={`faq-header-${index}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      onClick={() => toggleItem(index)}
                      className="w-full flex items-center gap-4 py-5 md:py-6 text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4 rounded-sm"
                    >
                      <span className="shrink-0 font-heading text-sm font-medium text-primary tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-medium text-lg md:text-xl text-foreground group-hover:text-foreground/80 transition-colors">
                        {item.question}
                      </span>
                      <span
                        className="shrink-0 w-6 h-6 flex items-center justify-center text-foreground/50 group-hover:text-foreground/70 transition-colors"
                        aria-hidden="true"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                          className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                        >
                          <path
                            d="M8 1v14M1 8h14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${index}`}
                    role="region"
                    aria-labelledby={`faq-header-${index}`}
                    ref={(el) => {
                      panelRefs.current[index] = el
                    }}
                    className="overflow-hidden"
                    hidden
                  >
                    <div className="pb-6 pl-10 pr-10">
                      <RichTextRenderer
                        data={item.answer as LexicalRootData}
                        className="text-base text-foreground/60 leading-relaxed [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </Section>
  )
}
