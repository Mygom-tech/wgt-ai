/**
 * Single source of truth for the header menu bar items.
 *
 * Each key maps 1:1 to a `header.nav.<key>` translation in src/messages/*.json
 * and to an optional CMS override at `site-settings.headerNav.<key>`. The CMS
 * value (when set) wins; otherwise the translation is used. See Header.tsx.
 *
 * `faq` is intentionally absent — it exists in the translations but is not part
 * of the header menu bar.
 */
export const HEADER_NAV_KEYS = [
  'about',
  'course',
  'howItWorks',
  'events',
  'blog',
  'contact',
] as const

export type HeaderNavKey = (typeof HEADER_NAV_KEYS)[number]
