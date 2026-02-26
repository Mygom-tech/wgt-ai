import { Resend } from 'resend'
import { getPayload } from 'payload'
import config from '@payload-config'

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'notifications@jarune.com'
}

// ─── Applicant Confirmation Email ───────────────────────────────────────────

export async function sendConfirmationEmail(params: {
  email: string
  name?: string
  formTitle: string
  successMessage?: string
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const displayName = params.name || params.email
    const year = new Date().getFullYear()

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e5e5;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:4px;color:#008080;">
                Application Received
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:500;line-height:1.2;color:#ffffff;letter-spacing:-0.02em;">
                Thank you, ${escapeHtml(displayName)}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <div style="width:32px;height:2px;background-color:#008080;margin-bottom:24px;"></div>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#333333;">
                We have received your application and our team will review it shortly. You will hear back from us soon.
              </p>
              ${
                params.successMessage
                  ? `<p style="margin:0;font-size:15px;line-height:1.7;color:#333333;">${escapeHtml(params.successMessage)}</p>`
                  : ''
              }
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#e5e5e5;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
                &copy; ${year} MYGOM. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    await resend.emails.send({
      from: getFromEmail(),
      to: params.email,
      subject: `Application received - ${escapeHtml(params.formTitle)}`,
      html,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Confirmation email failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ─── Admin Notification Email ───────────────────────────────────────────────

export async function notifyAdmins(params: {
  locale: string
  formTitle: string
  submissionData: Array<{ field: string; value: string }>
  email: string
  name?: string
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const payload = await getPayload({ config })

    // Find country admins for this locale
    const countryAdmins = await payload.find({
      collection: 'users',
      where: {
        role: { equals: 'country-admin' },
        assignedLocales: { contains: params.locale },
      },
      limit: 100,
      overrideAccess: true,
    })

    // Find all super-admins
    const superAdmins = await payload.find({
      collection: 'users',
      where: { role: { equals: 'super-admin' } },
      limit: 100,
      overrideAccess: true,
    })

    // Merge & deduplicate
    const adminEmails = [
      ...new Set([
        ...countryAdmins.docs.map((a) => a.email),
        ...superAdmins.docs.map((a) => a.email),
      ]),
    ].filter(Boolean)

    if (adminEmails.length === 0) {
      return { success: true } // No admins to notify, not an error
    }

    // Build simple HTML email
    const submissionRows = params.submissionData
      .map(
        (item) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">${escapeHtml(item.field)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(String(item.value))}</td></tr>`,
      )
      .join('')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#008080;">New Form Submission</h2>
        <p><strong>Form:</strong> ${escapeHtml(params.formTitle)}</p>
        <p><strong>Locale:</strong> ${params.locale.toUpperCase()}</p>
        <p><strong>From:</strong> ${escapeHtml(params.name || params.email)}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;">Field</th>
              <th style="padding:8px 12px;text-align:left;">Value</th>
            </tr>
          </thead>
          <tbody>${submissionRows}</tbody>
        </table>
      </div>
    `

    await resend.emails.send({
      from: getFromEmail(),
      to: adminEmails,
      subject: `New ${escapeHtml(params.formTitle)} submission from ${escapeHtml(params.name || params.email)}`,
      html,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Resend notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
