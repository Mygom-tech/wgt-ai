/** Escape HTML special characters */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Serialize Lexical rich-text node tree to an HTML string for JSON-LD. */
export function extractHtml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const root = (data as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root?.children) return ''

  function serializeText(n: Record<string, unknown>): string {
    if (typeof n.text !== 'string') return ''
    let html = escapeHtml(n.text)
    const fmt = (n.format as number) || 0
    if (fmt & 1) html = `<strong>${html}</strong>`
    if (fmt & 2) html = `<em>${html}</em>`
    if (fmt & 8) html = `<u>${html}</u>`
    if (fmt & 4) html = `<s>${html}</s>`
    return html
  }

  function walk(nodes: unknown[]): string {
    return nodes
      .map((node) => {
        if (!node || typeof node !== 'object') return ''
        const n = node as Record<string, unknown>

        switch (n.type) {
          case 'text':
            return serializeText(n)
          case 'linebreak':
            return '<br>'
          case 'paragraph':
            return `<p>${walk(n.children as unknown[])}</p>`
          case 'heading': {
            const tag = (n.tag as string) || 'h2'
            return `<${tag}>${walk(n.children as unknown[])}</${tag}>`
          }
          case 'link': {
            const fields = n.fields as Record<string, unknown> | undefined
            const url = escapeHtml((fields?.url as string) || '#')
            return `<a href="${url}">${walk(n.children as unknown[])}</a>`
          }
          case 'list': {
            const tag = n.listType === 'number' ? 'ol' : 'ul'
            return `<${tag}>${walk(n.children as unknown[])}</${tag}>`
          }
          case 'listitem':
            return `<li>${walk(n.children as unknown[])}</li>`
          case 'quote':
            return `<blockquote>${walk(n.children as unknown[])}</blockquote>`
          case 'horizontalrule':
            return '<hr>'
          default:
            if (Array.isArray(n.children)) return walk(n.children)
            return ''
        }
      })
      .join('')
  }

  return walk(root.children as unknown[])
}
