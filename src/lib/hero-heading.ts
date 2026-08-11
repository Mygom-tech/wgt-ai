/**
 * Pure helpers for `landing-page.hero.heading` (localized richText).
 *
 * Read path : heroHeadingToLines()  — src/sections/Hero.tsx
 * Write path: heroTextToLines() + heroLinesToHeadingValue()
 *             — scripts/migrate-wgt-65.ts
 *
 * Deliberately React-free (no JSX, no next/*) so the migration script can
 * import it from plain Node.
 *
 * Convention: **bold = accent colour**. Bold renders in `text-primary` (teal)
 * rather than heavier; italic, underline and strikethrough render literally.
 */

import { IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE } from '@/lib/lexical-format'

/**
 * Legacy heading strings used a real "\n" OR a literal backslash-n.
 * REMOVE WITH scripts/migrate-wgt-65.ts — see fromPlainString below.
 */
const LINE_SPLIT = /\\n|\n/

/**
 * The old Hero.tsx did `hero.highlightWord || 'everyone'`, so headings with no
 * highlightWord row still rendered "everyone" in the accent colour. The
 * migration reproduces that default; dropping it would silently de-accent the
 * shipped default copy in every locale.
 */
export const LEGACY_HIGHLIGHT_FALLBACK = 'everyone'

/**
 * Inline formatting carried by a run of characters.
 *
 * `accent` is stored as Lexical BOLD: the hero editor's bold button paints the
 * accent colour rather than making text heavier (see the field's admin
 * description). Every other flag renders literally.
 */
export type HeroFormat = {
  accent: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

export type HeroSegment = HeroFormat & { text: string }

/** One visual line of the H1: an ordered run of formatted segments. */
export type HeroLine = HeroSegment[]

const NO_FORMAT: HeroFormat = {
  accent: false,
  italic: false,
  underline: false,
  strikethrough: false,
}

function formatOf(format: number): HeroFormat {
  return {
    accent: (format & IS_BOLD) !== 0,
    italic: (format & IS_ITALIC) !== 0,
    underline: (format & IS_UNDERLINE) !== 0,
    strikethrough: (format & IS_STRIKETHROUGH) !== 0,
  }
}

function bitmaskOf(format: HeroFormat): number {
  return (
    (format.accent ? IS_BOLD : 0) |
    (format.italic ? IS_ITALIC : 0) |
    (format.underline ? IS_UNDERLINE : 0) |
    (format.strikethrough ? IS_STRIKETHROUGH : 0)
  )
}

function sameFormat(a: HeroFormat, b: HeroFormat): boolean {
  return (
    a.accent === b.accent &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.strikethrough === b.strikethrough
  )
}

type LexicalTextNode = {
  type: 'text'
  detail: number
  format: number
  mode: 'normal'
  style: string
  text: string
  version: number
}

type LexicalParagraphNode = {
  type: 'paragraph'
  children: LexicalTextNode[]
  direction: 'ltr' | null
  format: ''
  indent: number
  textFormat: number
  textStyle: string
  version: number
}

export type HeroHeadingValue = {
  root: {
    type: 'root'
    children: LexicalParagraphNode[]
    direction: 'ltr' | null
    format: ''
    indent: number
    version: number
  }
}

function makeSegment(text: string, format: Partial<HeroFormat> = {}): HeroSegment {
  return { ...NO_FORMAT, ...format, text }
}

/** Demo copy shown when the global is unreachable. Mirrors the old hardcoded default. */
export const DEFAULT_HERO_HEADING_LINES: HeroLine[] = [
  [makeSegment('Technology')],
  [makeSegment('should work')],
  [makeSegment('for '), makeSegment('everyone', { accent: true }), makeSegment('.')],
]

// ─── Read path ──────────────────────────────────────────────────────────────

type UnknownNode = { type?: unknown; text?: unknown; format?: unknown; children?: unknown }

/** Append text to a line, merging into the previous segment when the format matches. */
function pushSegment(line: HeroLine, text: string, format: HeroFormat): void {
  if (!text) return

  const last = line[line.length - 1]
  if (last && sameFormat(last, format)) {
    last.text += text
    return
  }

  line.push({ ...format, text })
}

/** Walk an inline subtree. A `linebreak` node (Shift+Enter) starts a new line. */
function collectInline(nodes: unknown[], lines: HeroLine[]): void {
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue
    const node = raw as UnknownNode

    if (node.type === 'linebreak') {
      lines.push([])
      continue
    }

    if (node.type === 'text' && typeof node.text === 'string') {
      const format = typeof node.format === 'number' ? node.format : 0
      pushSegment(lines[lines.length - 1]!, node.text, formatOf(format))
      continue
    }

    // Any other inline container (a link pasted in, etc.) — keep its text.
    if (Array.isArray(node.children)) collectInline(node.children, lines)
  }
}

function fromLexicalRoot(root: unknown): HeroLine[] {
  const children = (root as { children?: unknown } | null)?.children
  if (!Array.isArray(children)) return []

  const lines: HeroLine[] = []

  for (const raw of children) {
    if (!raw || typeof raw !== 'object') continue
    const block = raw as UnknownNode
    if (!Array.isArray(block.children)) continue

    lines.push([]) // one block-level node (paragraph) = one line
    collectInline(block.children, lines)
  }

  return lines
}

/**
 * REMOVE WITH scripts/migrate-wgt-65.ts (WGT-65). Only reachable while an
 * environment still holds pre-migration textarea strings; once every
 * environment is migrated, delete this, LINE_SPLIT's legacy note, the string
 * branch of heroHeadingToLines and its `unknown` parameter type.
 */
function fromPlainString(value: string): HeroLine[] {
  return value
    .replace(/\r/g, '')
    .split(LINE_SPLIT)
    .map<HeroLine>((line) => (line ? [makeSegment(line)] : []))
}

/**
 * Convert the stored value into renderable lines.
 *
 * Accepts a Lexical root object (current schema) OR a plain string (legacy,
 * pre-migration data) so an unmigrated environment degrades to plain,
 * un-accented lines instead of crashing. Returns [] when there is nothing
 * renderable — callers fall back to DEFAULT_HERO_HEADING_LINES.
 */
export function heroHeadingToLines(value: unknown): HeroLine[] {
  let lines: HeroLine[] = []

  if (typeof value === 'string') {
    lines = fromPlainString(value)
  } else if (value && typeof value === 'object' && 'root' in value) {
    lines = fromLexicalRoot((value as { root: unknown }).root)
  }

  // Drop TRAILING blank lines only. A trailing empty paragraph is a normal
  // editor artefact, but an interior or leading blank line is deliberate
  // spacing that the old textarea preserved — and dropping it would also shift
  // which line gets the muted `i === 0` colour in Hero.tsx.
  let end = lines.length
  while (end > 0 && !lines[end - 1]!.some((segment) => segment.text.trim() !== '')) end -= 1

  return lines.slice(0, end)
}

/** Flatten back to plain text — dry-run output and tests. */
export function heroLinesToText(lines: HeroLine[]): string {
  return lines.map((line) => line.map((segment) => segment.text).join('')).join('\n')
}

// ─── Write path (migration only) ────────────────────────────────────────────

function textNode(segment: HeroSegment): LexicalTextNode {
  return {
    type: 'text',
    detail: 0,
    format: bitmaskOf(segment),
    mode: 'normal',
    style: '',
    text: segment.text,
    version: 1,
  }
}

function paragraphNode(children: LexicalTextNode[]): LexicalParagraphNode {
  return {
    type: 'paragraph',
    children,
    direction: children.length ? 'ltr' : null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    version: 1,
  }
}

/** Build the Lexical field value from lines of segments. One line = one paragraph. */
export function heroLinesToHeadingValue(lines: HeroLine[]): HeroHeadingValue {
  return {
    root: {
      type: 'root',
      children: lines.map((line) =>
        paragraphNode(line.filter((segment) => segment.text !== '').map(textNode)),
      ),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Reproduce the LEGACY runtime highlight rule: split into lines, then in EACH
 * line accent the first case-insensitive SUBSTRING occurrence of
 * `highlightWord`. The old renderChars() ran per line, so a word appearing on
 * two lines was accented on both — migrating any other way visibly changes
 * existing headings.
 *
 * The word is used VERBATIM, exactly as the old renderer did: a stored value
 * with surrounding whitespace matched (or failed to match) with that
 * whitespace included, and reproducing that keeps the migrated heading
 * pixel-identical to what the site renders today.
 */
export function heroTextToLines(text: string, highlightWord?: string | null): HeroLine[] {
  const word = highlightWord || LEGACY_HIGHLIGHT_FALLBACK
  const needle = word.toLowerCase()

  return text
    .replace(/\r/g, '')
    .split(LINE_SPLIT)
    .map<HeroLine>((line) => {
      if (!line) return []

      const at = line.toLowerCase().indexOf(needle)
      if (at === -1) return [makeSegment(line)]

      const segments: HeroLine = []
      if (at > 0) segments.push(makeSegment(line.slice(0, at)))
      segments.push(makeSegment(line.slice(at, at + word.length), { accent: true }))
      if (at + word.length < line.length) {
        segments.push(makeSegment(line.slice(at + word.length)))
      }

      return segments
    })
}
