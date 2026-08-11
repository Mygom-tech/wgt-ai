import { describe, expect, it } from 'vitest'
import {
  LEGACY_HIGHLIGHT_FALLBACK,
  heroHeadingToLines,
  heroLinesToHeadingValue,
  heroLinesToText,
  heroTextToLines,
  type HeroFormat,
  type HeroLine,
  type HeroSegment,
} from '@/lib/hero-heading'

/** Expected segment with every format flag defaulting to false. */
const seg = (text: string, format: Partial<HeroFormat> = {}): HeroSegment => ({
  text,
  accent: false,
  italic: false,
  underline: false,
  strikethrough: false,
  ...format,
})

/** Minimal lexical builders — deliberately hand-written so a bug in the util can't hide one here. */
const text = (value: string, format = 0) => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const paragraph = (children: unknown[]) => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  version: 1,
})

const root = (children: unknown[]) => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

describe('heroHeadingToLines', () => {
  it('splits a legacy plain string on real newlines', () => {
    expect(heroHeadingToLines('Technology\nshould work\nfor everyone.')).toEqual([
      [seg('Technology')],
      [seg('should work')],
      [seg('for everyone.')],
    ])
  })

  it('splits a legacy plain string on literal backslash-n', () => {
    expect(heroHeadingToLines('Technology\\nshould work')).toEqual([
      [seg('Technology')],
      [seg('should work')],
    ])
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty object', {}],
    ['a number', 42],
    ['a null root', { root: null }],
    ['a root without children', { root: { type: 'root' } }],
    ['an empty string', ''],
  ])('returns [] for %s instead of throwing', (_label, value) => {
    expect(heroHeadingToLines(value)).toEqual([])
  })

  it('marks bold text nodes as accent', () => {
    const value = root([paragraph([text('for '), text('everyone', 1), text('.')])])

    expect(heroHeadingToLines(value)).toEqual([
      [seg('for '), seg('everyone', { accent: true }), seg('.')],
    ])
  })

  it('treats a linebreak node inside a paragraph as a new line', () => {
    const value = root([
      paragraph([text('Technology'), { type: 'linebreak' }, text('should work')]),
    ])

    expect(heroHeadingToLines(value)).toEqual([[seg('Technology')], [seg('should work')]])
  })

  it('merges adjacent segments that share a format', () => {
    const value = root([paragraph([text('should '), text('work'), text(' well', 1)])])

    expect(heroHeadingToLines(value)).toEqual([
      [seg('should work'), seg(' well', { accent: true })],
    ])
  })

  it('drops a trailing empty paragraph', () => {
    const value = root([paragraph([text('Technology')]), paragraph([]), paragraph([])])

    expect(heroHeadingToLines(value)).toEqual([[seg('Technology')]])
  })

  it('KEEPS an interior blank line (deliberate spacing the old textarea preserved)', () => {
    expect(heroHeadingToLines('Technology\n\nfor everyone.')).toEqual([
      [seg('Technology')],
      [],
      [seg('for everyone.')],
    ])
  })

  it('KEEPS a leading blank line so the muted first-line colour does not shift', () => {
    const [first] = heroHeadingToLines('\nTechnology')

    expect(first).toEqual([])
  })

  it.each([
    ['italic', 2, { italic: true }],
    ['underline', 8, { underline: true }],
    ['strikethrough', 4, { strikethrough: true }],
  ])('decodes %s from the format bitmask', (_label, bitmask, expected) => {
    const value = root([paragraph([text('everyone', bitmask as number)])])

    expect(heroHeadingToLines(value)).toEqual([[seg('everyone', expected as Partial<HeroFormat>)]])
  })

  it('decodes combined formats on one text node', () => {
    // bold + italic + underline = 1 | 2 | 8
    const value = root([paragraph([text('everyone', 11)])])

    expect(heroHeadingToLines(value)).toEqual([
      [seg('everyone', { accent: true, italic: true, underline: true })],
    ])
  })

  it('does NOT merge adjacent segments whose formats differ beyond accent', () => {
    const value = root([paragraph([text('should '), text('work', 2)])])

    expect(heroHeadingToLines(value)).toEqual([[seg('should '), seg('work', { italic: true })]])
  })

  it('ignores formats the hero editor does not offer', () => {
    // 16 = inline code, which is not registered on this field.
    const value = root([paragraph([text('everyone', 16)])])

    expect(heroHeadingToLines(value)).toEqual([[seg('everyone')]])
  })

  it('keeps the text of an unknown inline container', () => {
    const value = root([paragraph([{ type: 'link', children: [text('everyone', 1)], version: 1 }])])

    expect(heroHeadingToLines(value)).toEqual([[seg('everyone', { accent: true })]])
  })
})

describe('heroTextToLines', () => {
  it('accents the highlight word case-insensitively', () => {
    expect(heroTextToLines('for Everyone.', 'everyone')).toEqual([
      [seg('for '), seg('Everyone', { accent: true }), seg('.')],
    ])
  })

  it('accents the word on EVERY line it appears on (legacy per-line rule)', () => {
    const lines = heroTextToLines('everyone counts\nfor everyone', 'everyone')

    expect(lines.map((line) => line.some((segment) => segment.accent))).toEqual([true, true])
  })

  it('leaves the line untouched when the word does not occur', () => {
    expect(heroTextToLines('Technology', 'nope')).toEqual([[seg('Technology')]])
  })

  it.each([['' as string | null], [null], [undefined]])(
    'falls back to the legacy "everyone" default when highlightWord is %s',
    (word) => {
      expect(heroTextToLines('for everyone.', word)).toEqual([
        [seg('for '), seg(LEGACY_HIGHLIGHT_FALLBACK, { accent: true }), seg('.')],
      ])
    },
  )

  it('matches the word verbatim, exactly as the legacy renderer did', () => {
    // Trailing space: the old code looked up "everyone " and found nothing.
    expect(heroTextToLines('for everyone.', 'everyone ')).toEqual([[seg('for everyone.')]])
    // Leading space: the old code accented the space along with the word.
    expect(heroTextToLines('for everyone.', ' everyone')).toEqual([
      [seg('for'), seg(' everyone', { accent: true }), seg('.')],
    ])
  })
})

describe('round trip', () => {
  it('survives heroTextToLines -> heroLinesToHeadingValue -> heroHeadingToLines', () => {
    const original = 'Technology\nshould work\nfor everyone.'
    const lines = heroTextToLines(original, 'everyone')
    const restored = heroHeadingToLines(heroLinesToHeadingValue(lines))

    expect(restored).toEqual(lines)
    expect(heroLinesToText(restored)).toBe(original)
  })

  it('emits the lexical node shape Payload expects', () => {
    const value = heroLinesToHeadingValue([
      [seg('for '), seg('everyone', { accent: true })] satisfies HeroLine,
    ])

    expect(value.root.type).toBe('root')
    expect(value.root.children[0]).toMatchObject({
      type: 'paragraph',
      direction: 'ltr',
      format: '',
      indent: 0,
      textFormat: 0,
      version: 1,
    })
    expect(value.root.children[0]?.children).toEqual([
      { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'for ', version: 1 },
      {
        type: 'text',
        detail: 0,
        format: 1,
        mode: 'normal',
        style: '',
        text: 'everyone',
        version: 1,
      },
    ])
  })

  it('round-trips every format flag through the bitmask', () => {
    const lines: HeroLine[] = [
      [
        seg('a', { accent: true }),
        seg('b', { italic: true }),
        seg('c', { underline: true }),
        seg('d', { strikethrough: true }),
        seg('e', { accent: true, italic: true, underline: true, strikethrough: true }),
      ],
    ]

    expect(heroHeadingToLines(heroLinesToHeadingValue(lines))).toEqual(lines)
  })

  it('emits an empty paragraph with null direction for a blank line', () => {
    const value = heroLinesToHeadingValue([[]])

    expect(value.root.children[0]).toMatchObject({ children: [], direction: null })
  })
})
