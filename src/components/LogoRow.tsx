'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Image as PayloadImage } from '@/payload-types'

type TrustLogoItem = {
  image: string | PayloadImage
  id?: string | null
}

type LogoRowProps = {
  label?: string
  className?: string
  variant?: 'light' | 'dark'
  logos?: TrustLogoItem[] | null
}

export function LogoRow({
  label,
  className,
  variant = 'light',
  logos
}: LogoRowProps) {
  if (!logos || logos.length === 0) return null

  const labelColor = variant === 'dark' ? 'text-[#666666]' : 'text-neutral-400'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {label && (
        <p className={cn('text-[10px] font-bold uppercase tracking-[0.15em] opacity-70', labelColor)}>
          {label}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-8 md:gap-x-10 gap-y-4">
        {logos.map((item, i) => {
          const img = item.image
          const src = typeof img === 'string' ? '' : img.url
          const alt = typeof img === 'string' ? 'Partner Logo' : (img.alt || 'Partner Logo')

          if (!src) return null

          return (
            <div
              key={item.id || i}
              className="relative h-7 md:h-8 w-auto"
            >
              <Image
                src={src}
                alt={alt}
                width={120}
                height={32}
                className="h-full w-auto object-contain"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
