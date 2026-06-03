'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type Consent = {
  necessary: true
  analytics: boolean
  marketing: boolean
}

function getStoredConsent(): Consent | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('cookie_consent='))
  if (!cookie) return null
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')))
  } catch {
    return null
  }
}

function setConsentCookie(consent: Consent) {
  const maxAge = 365 * 24 * 60 * 60
  document.cookie = `cookie_consent=${JSON.stringify(consent)};max-age=${maxAge};path=/;SameSite=Lax`
  window.dispatchEvent(new Event('cookieConsentChanged'))
}

type CookieConsentProps = {
  cookiePolicyHref?: string | null
}

export function CookieConsent({ cookiePolicyHref }: CookieConsentProps) {
  const t = useTranslations('cookieConsent')
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const consent = getStoredConsent()
    if (!consent) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleAcceptAll = () => {
    setConsentCookie({ necessary: true, analytics: true, marketing: true })
    setVisible(false)
  }

  const handleRejectAll = () => {
    setConsentCookie({ necessary: true, analytics: false, marketing: false })
    setVisible(false)
  }

  const handleSave = () => {
    setConsentCookie({ necessary: true, analytics, marketing })
    setVisible(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        maxWidth: '400px',
        width: 'calc(100% - 2rem)',
        backgroundColor: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '1.25rem',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#1f2937',
      }}
    >
      <p style={{ fontWeight: 600, marginTop: 0, marginBottom: '0.5rem' }}>{t('title')}</p>
      <p style={{ margin: '0 0 1rem 0', color: '#4b5563' }}>{t('description')}</p>

      {showCustomize && (
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              cursor: 'not-allowed',
              opacity: 0.7,
            }}
          >
            <input type="checkbox" checked disabled style={{ marginTop: '2px' }} />
            <span>
              <strong>{t('necessary')}</strong>
              <br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {t('necessaryDescription')}
              </span>
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span>
              <strong>{t('analytics')}</strong>
              <br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {t('analyticsDescription')}
              </span>
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span>
              <strong>{t('marketing')}</strong>
              <br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {t('marketingDescription')}
              </span>
            </span>
          </label>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {showCustomize ? (
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              backgroundColor: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            {t('save')}
          </button>
        ) : (
          <>
            <button
              onClick={handleAcceptAll}
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                backgroundColor: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              {t('acceptAll')}
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleRejectAll}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  backgroundColor: '#fff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                {t('rejectAll')}
              </button>
              <button
                onClick={() => setShowCustomize(true)}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  backgroundColor: '#fff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                {t('customize')}
              </button>
            </div>
          </>
        )}
      </div>

      {cookiePolicyHref && (
        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
          <Link
            href={cookiePolicyHref}
            style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'underline' }}
          >
            {t('cookiePolicy')}
          </Link>
        </div>
      )}
    </div>
  )
}
