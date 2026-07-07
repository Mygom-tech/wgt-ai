import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { defaultLocale, localeCodes } from './i18n/locales'

const intlMiddleware = createMiddleware(routing)

/**
 * Map ISO 3166-1 alpha-2 country codes to our locale codes.
 * Only countries that map to a supported locale need to be listed.
 * All other countries fall through to Accept-Language → default (en).
 */
const countryToLocale: Record<string, string> = {
  lt: 'lt', // Lithuania
  lv: 'lv', // Latvia
  cz: 'cz', // Czech Republic (ISO 3166: CZ → locale: cz)
  ro: 'ro', // Romania
  bg: 'bg', // Bulgaria
  md: 'md', // Moldova
  pl: 'pl', // Poland
  ee: 'et', // Estonia (ISO 3166 country code EE → locale et)
}

/**
 * Extract the visitor's country from CDN-provided geo headers.
 * Checks all major CDN/platform headers for maximum portability.
 *
 * Detection priority:
 *   1. NEXT_LOCALE cookie (user's explicit choice from locale selector)
 *   2. CDN geo IP headers (resolved at edge, zero latency)
 *   3. Accept-Language header (browser language - handled by next-intl)
 *   4. Default locale: en
 */
function getGeoCountry(request: NextRequest): string | null {
  // Vercel - automatically added on all deployments
  const vercel = request.headers.get('x-vercel-ip-country')
  if (vercel) return vercel.toLowerCase()

  // Cloudflare - available on all plans, added automatically
  const cloudflare = request.headers.get('cf-ipcountry')
  if (cloudflare) return cloudflare.toLowerCase()

  // AWS CloudFront - requires cache policy configuration
  const cloudfront = request.headers.get('cloudfront-viewer-country')
  if (cloudfront) return cloudfront.toLowerCase()

  // Fastly - added via VCL configuration
  const fastly = request.headers.get('x-country-code')
  if (fastly) return fastly.toLowerCase()

  // Bunny.net - automatically added
  const bunny = request.headers.get('bunny-ipcountrycode')
  if (bunny) return bunny.toLowerCase()

  // Fly.io - automatically added
  const fly = request.headers.get('fly-client-country')
  if (fly) return fly.toLowerCase()

  return null
}

const COOKIE_NAME = 'NEXT_LOCALE'

const FALLBACK_PARAM = '__fallback'

export default function middleware(request: NextRequest) {
  // Layout redirects here when the locale is not enabled in the CMS.
  // Reset the cookie to the default locale and redirect to a clean URL.
  if (request.nextUrl.searchParams.has(FALLBACK_PARAM)) {
    const url = request.nextUrl.clone()
    url.searchParams.delete(FALLBACK_PARAM)
    url.pathname = '/'

    request.cookies.set(COOKIE_NAME, defaultLocale)
    const response = NextResponse.redirect(url)
    response.cookies.set(COOKIE_NAME, defaultLocale, { path: '/' })
    return response
  }

  // If user has no locale cookie yet, try to detect from geo IP
  if (!request.cookies.has(COOKIE_NAME)) {
    const country = getGeoCountry(request)
    if (country) {
      const geoLocale = countryToLocale[country]
      if (geoLocale && localeCodes.includes(geoLocale as (typeof localeCodes)[number])) {
        // Set cookie on the request so next-intl picks it up during resolution
        request.cookies.set(COOKIE_NAME, geoLocale)
      }
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
