export type FormVariant = 'dark' | 'light'

export const inputStyles = {
  dark: 'w-full border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[0.95rem] text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors rounded-[2px]',
  light: 'w-full border border-foreground/15 bg-background px-4 py-3.5 text-[0.95rem] text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors rounded-[2px]',
} as const

export const labelStyles = {
  dark: 'block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50 mb-3',
  light: 'block text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/60 mb-3',
} as const

export const errorStyles = {
  dark: 'mt-2 text-[11px] uppercase tracking-[0.15em] text-red-400',
  light: 'mt-2 text-[11px] uppercase tracking-[0.15em] text-red-600',
} as const

export const checkboxInput = {
  dark: 'mt-0.5 h-4 w-4 border border-white/[0.08] bg-white/[0.03] text-primary focus:ring-primary/50 rounded-[2px] cursor-pointer',
  light: 'mt-0.5 h-4 w-4 border border-foreground/15 bg-background text-primary focus:ring-primary/50 rounded-[2px] cursor-pointer',
} as const

export const checkboxLabel = {
  dark: 'text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors',
  light: 'text-sm text-foreground/70 leading-relaxed group-hover:text-foreground transition-colors',
} as const

export const selectArrow = {
  dark: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='1.5'/%3E%3C/svg%3E")`,
  light: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='rgba(0,0,0,0.3)' stroke-width='1.5'/%3E%3C/svg%3E")`,
} as const
