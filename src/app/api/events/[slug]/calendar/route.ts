import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import type { Event } from '@/payload-types'

// RFC 5545 escaping: backslash, semicolon, comma, newline
function esc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// RFC 5545 line folding at 75 octets
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  for (let i = 0; i < line.length; i += 74) {
    parts.push((i ? ' ' : '') + line.slice(i, i + 74))
  }
  return parts.join('\r\n')
}

function fmtNow(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const ss = String(now.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}${ss}Z`
}

function fmtDate(dateStr: string): string {
  const date = new Date(dateStr)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function fmtDateNextDay(dateStr: string): string {
  const date = new Date(dateStr)
  date.setUTCDate(date.getUTCDate() + 1)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function fmtDateTime(dateStr: string, timeStr: string): string {
  const date = new Date(dateStr)
  const time = new Date(timeStr)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(time.getUTCHours()).padStart(2, '0')
  const mm = String(time.getUTCMinutes()).padStart(2, '0')
  const ss = String(time.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}${ss}`
}

function fmtDateTimePlusHour(dateStr: string, timeStr: string): string {
  const date = new Date(dateStr)
  const time = new Date(timeStr)
  time.setUTCHours(time.getUTCHours() + 1)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(time.getUTCHours()).padStart(2, '0')
  const mm = String(time.getUTCMinutes()).padStart(2, '0')
  const ss = String(time.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}${ss}`
}

function generateICS(event: Event): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jarune//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@jarune.com`,
    `DTSTAMP:${fmtNow()}`,
  ]

  if (event.timeFrom) {
    const tzid = event.timeZone || 'UTC'
    lines.push(`DTSTART;TZID=${tzid}:${fmtDateTime(event.date, event.timeFrom)}`)
    lines.push(
      `DTEND;TZID=${tzid}:${
        event.timeTo
          ? fmtDateTime(event.endDate || event.date, event.timeTo)
          : fmtDateTimePlusHour(event.date, event.timeFrom)
      }`,
    )
  } else {
    lines.push(`DTSTART;VALUE=DATE:${fmtDate(event.date)}`)
    if (event.endDate) {
      lines.push(`DTEND;VALUE=DATE:${fmtDateNextDay(event.endDate)}`)
    }
  }

  lines.push(`SUMMARY:${esc(event.title)}`)
  if (event.location) lines.push(`LOCATION:${esc(event.location)}`)
  if (event.excerpt) lines.push(`DESCRIPTION:${esc(event.excerpt)}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })

  const event = result.docs[0] as Event | undefined
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ics = generateICS(event)
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  })
}
