import type { SiteSetting } from '@/payload-types'

type SocialLink = NonNullable<SiteSetting['socialLinks']>[number]

/**
 * Extracts a Twitter/X @handle from the social links array.
 * Returns undefined if no X link is configured.
 */
export function getTwitterHandle(
  socialLinks: SocialLink[] | null | undefined,
): string | undefined {
  const xLink = socialLinks?.find((link) => link.platform === 'x')
  if (!xLink?.url) return undefined

  // Extract handle from URL like https://x.com/yourcompany or https://twitter.com/yourcompany
  const match = xLink.url.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/)
  return match ? `@${match[1]}` : undefined
}
