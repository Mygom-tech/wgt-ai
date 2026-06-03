import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useFitText<T extends HTMLElement>(ref: RefObject<T | null>, minScale = 0.5): void {
  const fit = useCallback(() => {
    const el = ref.current
    if (!el) return

    el.style.setProperty('--fit-scale', '1')

    const available = el.clientWidth
    if (available === 0) return

    let widest = 0
    for (const child of Array.from(el.children)) {
      widest = Math.max(widest, (child as HTMLElement).scrollWidth)
    }
    if (widest === 0) return

    const scale = Math.min(1, Math.max(minScale, available / widest))
    el.style.setProperty('--fit-scale', String(scale))
  }, [ref, minScale])

  useIsomorphicLayoutEffect(() => {
    fit()

    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(() => fit())
    observer.observe(el)
    if (el.parentElement) observer.observe(el.parentElement)

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready
        .then(fit)
        .catch((error) => console.error('[useFitText] font readiness check failed', error))
    }

    return () => observer.disconnect()
  }, [fit, ref])
}
