'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

const COUNT_ENDPOINT = '/api/form-submissions/omnisend-failed-count'
const RESYNC_ENDPOINT = '/api/form-submissions/resync-omnisend'
const MAX_BATCHES = 100 // safety cap (100 × 25 = 2500 contacts per click)

type BatchResult = { succeeded: number; remaining: number; error?: string }

const RED = '#dc2626'
const GREEN = '#16a34a'

/**
 * Admin-only control on the Form Submissions list: shows the current count of failed Omnisend
 * syncs and re-sends them all in one click (looping bounded batches to respect rate limits).
 * Super-admins only; the endpoints enforce this server-side too.
 */
export const ResyncOmnisendButton: React.FC = () => {
  const { user } = useAuth()
  const isSuperAdmin = (user as { role?: string } | null)?.role === 'super-admin'

  const [failed, setFailed] = useState<number | null>(null) // null = still loading
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  const loadCount = useCallback(async () => {
    try {
      const res = await fetch(COUNT_ENDPOINT, { credentials: 'include' })
      if (!res.ok) return
      const data = (await res.json()) as { failed?: number }
      setFailed(typeof data.failed === 'number' ? data.failed : 0)
    } catch {
      // leave the badge as-is on a transient error
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) void loadCount()
  }, [isSuperAdmin, loadCount])

  if (!isSuperAdmin) return null

  const hasFailed = (failed ?? 0) > 0
  const disabled = running || !hasFailed || failed === null

  async function handleClick() {
    if (disabled) return
    const total = failed ?? 0
    let succeeded = 0

    setRunning(true)
    setMessage('')
    try {
      for (let i = 0; i < MAX_BATCHES; i++) {
        const res = await fetch(RESYNC_ENDPOINT, { method: 'POST', credentials: 'include' })
        const data = (await res.json()) as BatchResult

        if (!res.ok) {
          setMessage(`Error: ${data.error ?? `request failed (${res.status})`}`)
          break
        }

        succeeded += data.succeeded
        setFailed(data.remaining)
        setMessage(`Resynced ${succeeded} out of ${total}…`)

        // Done, or a batch made no progress (would loop forever otherwise).
        if (data.remaining === 0 || data.succeeded === 0) break
      }
      setMessage(`Resynced ${succeeded} out of ${total}.`)
    } catch {
      setMessage('Request failed. Check the server logs.')
    } finally {
      setRunning(false)
      void loadCount()
    }
  }

  const accent = hasFailed ? RED : GREEN

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.75rem 0' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: `${accent}1f`,
          color: accent,
        }}
      >
        <span
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }}
          aria-hidden
        />
        {failed === null ? 'Checking…' : hasFailed ? `${failed} failed` : 'All synced'}
      </span>

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={{
          padding: '7px 16px',
          borderRadius: 6,
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          background: hasFailed ? RED : GREEN,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'opacity .15s ease, background .15s ease',
        }}
      >
        {running ? 'Resyncing…' : 'Resync failed'}
      </button>

      {message && (
        <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>{message}</span>
      )}
    </div>
  )
}
