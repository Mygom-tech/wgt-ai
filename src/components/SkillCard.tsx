'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { Image as PayloadImage } from '@/payload-types'

type SkillCardProps = {
  title: string
  description: string
  image?: PayloadImage | null
  index: number
  skillLabel: string
  /** Renders the card at double width in the grid */
  featured?: boolean
}

export function SkillCard({
  title,
  description,
  image,
  index,
  skillLabel,
  featured = false,
}: SkillCardProps) {
  const label = String(index + 1).padStart(2, '0')

  return (
    <li
      data-skills-card
      className={cn(
        'relative flex flex-col bg-[#0a0a0a] p-7 sm:p-9 lg:p-12',
        featured
          ? 'lg:col-span-2 min-h-[320px] sm:min-h-[360px] lg:min-h-[400px]'
          : 'min-h-[300px] sm:min-h-[340px] lg:min-h-[400px]',
      )}
    >
      {/* Background image */}
      {image?.url && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={image.url}
            alt={image.alt || ''}
            fill
            sizes={
              featured
                ? '(max-width: 768px) 100vw, 66vw'
                : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
            loading="lazy"
            className="object-cover opacity-25 saturate-[0.7] brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>
      )}

      {/* Skill index */}
      <Eyebrow
        label={`${skillLabel} ${label}`}
        variant="dot"
        color="white"
        className="relative z-10 gap-2 [&_span:last-child]:text-white/60 [&_span:last-child]:font-black [&_span:last-child]:md:text-xs"
      />

      {/* Content - pinned to bottom */}
      <div className="relative z-10 mt-auto flex flex-col gap-4">
        <h3
          className={cn(
            'font-heading uppercase text-white font-medium leading-tight',
            featured
              ? 'text-2xl sm:text-3xl lg:text-[2.25rem] tracking-[-0.03em]'
              : 'text-xl sm:text-2xl lg:text-[1.75rem] tracking-[-0.02em]',
          )}
        >
          {title}
        </h3>

        <div className="w-8 h-px bg-primary/50" />

        <p className="text-body text-white/70 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Decorative number watermark */}
      <span
        aria-hidden="true"
        className="absolute top-6 right-6 lg:top-10 lg:right-10 text-[6rem] sm:text-[7rem] lg:text-[9rem] font-medium font-heading text-white/[0.03] pointer-events-none select-none leading-none"
      >
        {label}
      </span>
    </li>
  )
}
