'use client'

import { cn } from '@/lib/utils'

type GridLinesProps = {
  columns?: number
  rows?: number
  className?: string
  lineColor?: string
}

export function GridLines({
  columns = 12,
  rows = 8,
  className,
  lineColor = 'rgba(17,17,17,0.12)',
}: GridLinesProps) {
  // Base spacing for lines
  const colWidth = `calc((100% - 4vw) / ${columns})`
  const rowHeight = `calc((100% - 4vh) / ${rows})`

  // Dim variants for non-emphasized lines (40% for vertical, 30% for horizontal)
  const dimV = lineColor.replace(/[\d.]+\)$/, (m) => `${(parseFloat(m) * 0.4).toFixed(4)})`)
  const dimH = lineColor.replace(/[\d.]+\)$/, (m) => `${(parseFloat(m) * 0.3).toFixed(4)})`)

  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 z-0 pointer-events-none overflow-hidden', className)}
      style={{
        backgroundImage: [
          // Every-4th vertical line at full opacity
          `repeating-linear-gradient(to right, ${lineColor} 0 1px, transparent 1px calc(${colWidth} * 4))`,
          // All vertical lines at dim opacity
          `repeating-linear-gradient(to right, ${dimV} 0 1px, transparent 1px ${colWidth})`,
          // Every-2nd horizontal line at full opacity
          `repeating-linear-gradient(to bottom, ${lineColor} 0 1px, transparent 1px calc(${rowHeight} * 2))`,
          // All horizontal lines at dim opacity
          `repeating-linear-gradient(to bottom, ${dimH} 0 1px, transparent 1px ${rowHeight})`,
        ].join(', '),
        backgroundPosition: '2vw 2vh',
        backgroundSize: 'calc(100% - 4vw + 1px) calc(100% - 4vh + 1px)',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
