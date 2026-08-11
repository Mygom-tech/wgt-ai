/**
 * Lexical text-format flags (bitmask on a text node's `format`).
 *
 * Shared by every Lexical consumer in the repo: the React serializer
 * (`src/components/RichTextRenderer.tsx`), the JSON-LD HTML serializer
 * (`src/lib/lexical-html.ts`) and the hero heading util
 * (`src/lib/hero-heading.ts`).
 *
 * Keep this module free of React and `next/*` — `hero-heading.ts` imports it
 * and is itself imported by a plain Node migration script.
 */
export const IS_BOLD = 1
export const IS_ITALIC = 2
export const IS_STRIKETHROUGH = 4
export const IS_UNDERLINE = 8
export const IS_CODE = 16
export const IS_SUBSCRIPT = 32
export const IS_SUPERSCRIPT = 64
