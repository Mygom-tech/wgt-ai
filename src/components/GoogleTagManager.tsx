'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

function getConsent(): { analytics: boolean } | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith('cookie_consent='))
  if (!cookie) return null
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')))
  } catch {
    return null
  }
}

export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const check = () => {
      const consent = getConsent()
      setHasConsent(consent?.analytics === true)
    }
    check()
    window.addEventListener('cookieConsentChanged', check)
    return () => window.removeEventListener('cookieConsentChanged', check)
  }, [])

  if (!gtmId || process.env.NODE_ENV !== 'production' || !hasConsent) return null

  return (
    <Script
      id="gtm-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
      }}
    />
  )
}

export function GoogleTagManagerNoScript({ gtmId }: { gtmId: string }) {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const check = () => {
      const consent = getConsent()
      setHasConsent(consent?.analytics === true)
    }
    check()
    window.addEventListener('cookieConsentChanged', check)
    return () => window.removeEventListener('cookieConsentChanged', check)
  }, [])

  if (!gtmId || process.env.NODE_ENV !== 'production' || !hasConsent) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
