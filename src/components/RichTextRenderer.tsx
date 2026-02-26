import { Fragment, type ReactNode } from 'react'
import NextImage from 'next/image'
import type { Image as PayloadImage } from '@/payload-types'

// Lexical format flags (bitmask)
const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16
const IS_SUBSCRIPT = 32
const IS_SUPERSCRIPT = 64

export interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  [k: string]: unknown
}

export interface LexicalLinebreakNode {
  type: 'linebreak'
  [k: string]: unknown
}

export interface LexicalLinkNode {
  type: 'link'
  children: LexicalNode[]
  fields?: {
    url?: string
    newTab?: boolean
    linkType?: 'custom' | 'internal'
    [k: string]: unknown
  }
  [k: string]: unknown
}

export interface LexicalHeadingNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: LexicalNode[]
  [k: string]: unknown
}

export interface LexicalParagraphNode {
  type: 'paragraph'
  children: LexicalNode[]
  [k: string]: unknown
}

export interface LexicalListNode {
  type: 'list'
  listType: 'bullet' | 'number' | 'check'
  children: LexicalNode[]
  [k: string]: unknown
}

export interface LexicalListItemNode {
  type: 'listitem'
  children: LexicalNode[]
  [k: string]: unknown
}

export interface LexicalBlockquoteNode {
  type: 'quote'
  children: LexicalNode[]
  [k: string]: unknown
}

export interface LexicalHorizontalRuleNode {
  type: 'horizontalrule'
  [k: string]: unknown
}

export interface LexicalUploadNode {
  type: 'upload'
  relationTo: string
  value: string | PayloadImage
  fields?: {
    alt?: string
    caption?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

export interface LexicalTableCellNode {
  type: 'tablecell'
  headerState?: number
  colSpan?: number
  rowSpan?: number
  children: LexicalNode[]
  [k: string]: unknown
}

export interface LexicalTableRowNode {
  type: 'tablerow'
  children: LexicalTableCellNode[]
  [k: string]: unknown
}

export interface LexicalTableNode {
  type: 'table'
  children: LexicalTableRowNode[]
  [k: string]: unknown
}

export interface LexicalBlockNode {
  type: 'block'
  fields: {
    blockType: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

export type LexicalNode =
  | LexicalTextNode
  | LexicalLinebreakNode
  | LexicalLinkNode
  | LexicalHeadingNode
  | LexicalParagraphNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalBlockquoteNode
  | LexicalHorizontalRuleNode
  | LexicalUploadNode
  | LexicalTableNode
  | LexicalTableRowNode
  | LexicalTableCellNode
  | LexicalBlockNode

export interface LexicalRootData {
  root: {
    type: string
    children: LexicalNode[]
    direction?: ('ltr' | 'rtl') | null
    format?: string
    indent?: number
    version?: number
  }
  [k: string]: unknown
}

interface RichTextRendererProps {
  data: LexicalRootData | null | undefined
  className?: string
}

function renderText(node: LexicalTextNode): ReactNode {
  let content: ReactNode = node.text

  if (node.format & IS_BOLD) content = <strong>{content}</strong>
  if (node.format & IS_ITALIC) content = <em>{content}</em>
  if (node.format & IS_UNDERLINE) content = <u>{content}</u>
  if (node.format & IS_STRIKETHROUGH) content = <s>{content}</s>
  if (node.format & IS_CODE) content = <code>{content}</code>
  if (node.format & IS_SUBSCRIPT) content = <sub>{content}</sub>
  if (node.format & IS_SUPERSCRIPT) content = <sup>{content}</sup>

  return content
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

function renderUpload(node: LexicalUploadNode, index: number): ReactNode {
  const doc = typeof node.value === 'object' ? node.value : null
  if (!doc?.url) return null

  const alt = node.fields?.alt || doc.alt || ''
  const caption = node.fields?.caption || doc.caption

  return (
    <figure key={index} className="rich-text-upload">
      <NextImage
        src={doc.url}
        alt={alt}
        width={doc.width ?? 800}
        height={doc.height ?? 600}
        className="rounded-lg"
        sizes="(max-width: 45rem) 100vw, 45rem"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption>
      )}
    </figure>
  )
}

function renderTable(node: LexicalTableNode, index: number): ReactNode {
  return (
    <div key={index} className="rich-text-table-wrap">
      <table>
        <tbody>
          {node.children.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.children.map((cell, cellIdx) => {
                const isHeader = (cell.headerState ?? 0) > 0
                const Tag = isHeader ? 'th' : 'td'
                return (
                  <Tag
                    key={cellIdx}
                    colSpan={cell.colSpan && cell.colSpan > 1 ? cell.colSpan : undefined}
                    rowSpan={cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined}
                  >
                    {renderChildren(cell.children)}
                  </Tag>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderYouTube(node: LexicalBlockNode, index: number): ReactNode {
  const url = node.fields.url as string | undefined
  if (!url) return null
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  return (
    <div key={index} className="rich-text-youtube">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function renderNode(node: LexicalNode, index: number): ReactNode {
  switch (node.type) {
    case 'text':
      return <Fragment key={index}>{renderText(node)}</Fragment>

    case 'linebreak':
      return <br key={index} />

    case 'paragraph':
      return <p key={index}>{renderChildren(node.children)}</p>

    case 'heading': {
      const Tag = node.tag
      return <Tag key={index}>{renderChildren(node.children)}</Tag>
    }

    case 'link': {
      const url = node.fields?.url || '#'
      const newTab = node.fields?.newTab
      return (
        <a
          key={index}
          href={url}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderChildren(node.children)}
        </a>
      )
    }

    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={index} role="list">{renderChildren(node.children)}</Tag>
    }

    case 'listitem':
      return <li key={index}>{renderChildren(node.children)}</li>

    case 'quote':
      return <blockquote key={index}>{renderChildren(node.children)}</blockquote>

    case 'horizontalrule':
      return <hr key={index} />

    case 'upload':
      return renderUpload(node, index)

    case 'table':
      return renderTable(node, index)

    case 'block': {
      if (node.fields.blockType === 'youtube') {
        return renderYouTube(node, index)
      }
      return null
    }

    default:
      return null
  }
}

function renderChildren(children: LexicalNode[]): ReactNode {
  return children.map((child, i) => renderNode(child, i))
}

export function RichTextRenderer({ data, className }: RichTextRendererProps) {
  if (!data?.root?.children?.length) return null

  return (
    <div className={className}>
      {renderChildren(data.root.children as LexicalNode[])}
    </div>
  )
}
