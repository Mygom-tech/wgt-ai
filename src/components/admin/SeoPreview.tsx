'use client'

import React, { useEffect, useState } from 'react'
import { useAllFormFields, useDocumentInfo } from '@payloadcms/ui'

interface SiteSettingsData {
  siteName?: string
  siteUrl?: string
}

export const SeoPreview: React.FC = () => {
  const [fields] = useAllFormFields()
  const { id } = useDocumentInfo()
  const [settings, setSettings] = useState<SiteSettingsData>({
    siteName: 'Jarune',
    siteUrl: 'http://localhost:3000',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/globals/site-settings')
      .then((res) => res.json())
      .then((data: SiteSettingsData) => {
        setSettings({
          siteName: data.siteName || 'Jarune',
          siteUrl: data.siteUrl || 'http://localhost:3000',
        })
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => setLoading(false))
  }, [])

  const siteName = settings.siteName || 'Jarune'
  const siteUrl = settings.siteUrl || 'http://localhost:3000'

  const docTitle = String(fields?.title?.value ?? '')
  const metaTitle = String(fields?.['meta.title']?.value ?? '') || docTitle || 'Untitled Page'
  const metaDescription =
    String(fields?.['meta.description']?.value ?? '') ||
    String(fields?.excerpt?.value ?? '') ||
    ''
  const slug = String(fields?.slug?.value ?? '')

  const domain = siteUrl.replace(/^https?:\/\//, '')
  const fullUrl = slug ? `${domain}/${slug}` : domain
  const initial = siteName.charAt(0).toUpperCase()

  const truncatedTitle = metaTitle.length > 60 ? metaTitle.slice(0, 57) + '...' : metaTitle
  const truncatedDescription =
    metaDescription.length > 160 ? metaDescription.slice(0, 157) + '...' : metaDescription

  if (loading) {
    return (
      <div style={{ padding: '12px 0', color: '#70757a', fontSize: '13px' }}>
        Loading preview...
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <div
        style={{
          fontSize: '13px',
          color: '#70757a',
          marginBottom: '12px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Google Search preview
        {metaTitle.length > 60 && (
          <span style={{ color: '#ea4335', marginLeft: '8px' }}>
            Title is {metaTitle.length}/60 characters (may be truncated)
          </span>
        )}
        {metaDescription.length > 160 && (
          <span style={{ color: '#ea4335', marginLeft: '8px' }}>
            Description is {metaDescription.length}/160 characters (may be truncated)
          </span>
        )}
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '16px 16px 20px',
          maxWidth: '600px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Site identity row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#f1f3f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#4285f4',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                lineHeight: '20px',
                color: '#202124',
              }}
            >
              {siteName}
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#4d5156',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fullUrl}
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '20px',
            lineHeight: '26px',
            color: '#1a0dab',
            marginBottom: '4px',
            fontWeight: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {truncatedTitle}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '14px',
            lineHeight: '22px',
            color: '#4d5156',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {truncatedDescription || (
            <span style={{ color: '#9aa0a6', fontStyle: 'italic' }}>
              No meta description set. Add one for better search visibility.
            </span>
          )}
        </div>

        {/* Character counts */}
        {id && (
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #e8eaed',
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: '#70757a',
            }}
          >
            <span>
              Title:{' '}
              <span style={{ color: metaTitle.length > 60 ? '#ea4335' : '#188038' }}>
                {metaTitle.length}/60
              </span>
            </span>
            <span>
              Description:{' '}
              <span style={{ color: metaDescription.length > 160 ? '#ea4335' : '#188038' }}>
                {metaDescription.length}/160
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
