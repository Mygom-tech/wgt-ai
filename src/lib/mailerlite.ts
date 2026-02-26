const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/subscribers'

export async function syncToMailerLite(params: {
  email: string
  fields?: Record<string, string>
  groupId?: string
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILERLITE_API_KEY
  if (!apiKey) {
    return { success: false, error: 'MAILERLITE_API_KEY not configured' }
  }

  try {
    const body: Record<string, unknown> = {
      email: params.email,
    }

    if (params.fields) {
      body.fields = params.fields
    }

    if (params.groupId) {
      body.groups = [params.groupId]
    }

    const response = await fetch(MAILERLITE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: `MailerLite API error ${response.status}: ${JSON.stringify(errorData)}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `MailerLite sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
