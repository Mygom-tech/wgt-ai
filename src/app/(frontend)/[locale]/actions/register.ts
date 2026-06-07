'use server'

import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { syncToOmnisend, OMNISEND_SOURCE_TAG } from '@/lib/omnisend'
import { notifyAdmins, sendConfirmationEmail } from '@/lib/resend'
import type { ServiceResult } from '@/lib/service-result'
import type { Form, FormSubmission } from '@/payload-types'

type FormStep = NonNullable<Form['steps']>[number]
type FormField = NonNullable<FormStep['fields']>[number]

export async function submitForm(
  formId: string,
  locale: string,
  rawData: Record<string, string | boolean>,
): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
  // Honeypot check - silently reject bots
  if (rawData._hp) {
    return { success: true, message: '' }
  }

  const payload = await getPayload({ config })

  // Fetch form definition by ID
  let form: Form | null = null
  try {
    form = await payload.findByID({
      collection: 'forms',
      id: formId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return { success: false, message: 'Form not found' }
  }

  if (!form) {
    return { success: false, message: 'Form not found' }
  }

  const fields: FormField[] = (form.steps ?? []).flatMap((step) => step.fields ?? [])

  // Build zod schema dynamically from form fields
  const schemaShape: Record<string, z.ZodType> = {}

  // Built-in email field - always required
  schemaShape['email'] = z.string().email({ message: 'Invalid email' })

  for (const block of fields) {
    const { blockType, name, required } = block

    switch (blockType) {
      case 'textField':
      case 'selectField':
        schemaShape[name] = required
          ? z.string().min(1, { message: 'Required' })
          : z.string().optional()
        break

      case 'phoneField':
        schemaShape[name] = required
          ? z.string().min(1, { message: 'Required' })
          : z.string().optional()
        break

      case 'textareaField':
        if (required) {
          let schema = z.string().min(1, { message: 'Required' })
          if (block.maxLength) {
            schema = schema.max(block.maxLength)
          }
          schemaShape[name] = schema
        } else {
          let schema = z.string()
          if (block.maxLength) {
            schema = schema.max(block.maxLength)
          }
          schemaShape[name] = schema.optional()
        }
        break

      case 'checkboxField':
        schemaShape[name] = required
          ? z.literal(true, { message: 'Required' })
          : z.boolean().optional()
        break
    }
  }

  const formSchema = z.object(schemaShape)
  const validation = formSchema.safeParse(rawData)

  if (!validation.success) {
    const errors: Record<string, string> = {}
    for (const issue of validation.error.issues) {
      const fieldName = String(issue.path[0])
      if (!errors[fieldName]) {
        errors[fieldName] = issue.message
      }
    }
    return { success: false, errors }
  }

  // Email always comes from the built-in email field
  const extractedEmail = String(rawData.email || '')

  // Extract name from first textField
  let extractedName = ''
  for (const block of fields) {
    if (block.blockType === 'textField' && !extractedName) {
      extractedName = String(rawData[block.name] || '')
    }
  }

  // Build submission data array (include built-in email + all block fields)
  const submissionDataArray = [
    { field: 'email', value: extractedEmail },
    ...fields.map((block: FormField) => ({
      field: block.name,
      value: String(rawData[block.name] ?? ''),
    })),
  ]

  // Save to Payload - this MUST succeed before external calls
  const submission = await payload.create({
    collection: 'form-submissions',
    data: {
      form: form.id,
      locale: locale as FormSubmission['locale'],
      submissionData: submissionDataArray,
      email: extractedEmail,
      name: extractedName,
    },
    overrideAccess: true,
  })

  // Async integrations - run after submission is saved
  const shouldNotifyAdmins = form.notifyAdmin === true

  const tags = [OMNISEND_SOURCE_TAG.form, form.omnisendTag].filter((tag): tag is string =>
    Boolean(tag),
  )

  const [omnisendResult, notifyResult, confirmResult] = await Promise.allSettled([
    syncToOmnisend({
      email: extractedEmail,
      status: form.subscribeOnSubmit ? 'subscribed' : undefined,
      firstName: extractedName || undefined,
      tags,
      customProperties: { locale, form_source: form.title },
    }),
    shouldNotifyAdmins
      ? notifyAdmins({
          locale,
          formTitle: form.title,
          submissionData: submissionDataArray,
          email: extractedEmail,
          name: extractedName,
        })
      : Promise.resolve<ServiceResult>({ success: true }),
    sendConfirmationEmail({
      email: extractedEmail,
      name: extractedName,
      formTitle: form.title,
      successMessage: form.successMessage || undefined,
    }),
  ])

  // Log integration errors for debugging
  const omnisendSuccess = omnisendResult.status === 'fulfilled' && omnisendResult.value.success
  const notifySuccess = notifyResult.status === 'fulfilled' && notifyResult.value.success
  const confirmSuccess = confirmResult.status === 'fulfilled' && confirmResult.value.success

  if (!omnisendSuccess) {
    const err =
      omnisendResult.status === 'fulfilled' ? omnisendResult.value.error : omnisendResult.reason
    payload.logger.error(`[Form] Omnisend sync failed for ${extractedEmail}: ${err}`)
  }

  if (shouldNotifyAdmins && !notifySuccess) {
    const err = notifyResult.status === 'fulfilled' ? notifyResult.value.error : notifyResult.reason
    payload.logger.error(`[Form] Admin notification failed for ${extractedEmail}: ${err}`)
  }

  if (!confirmSuccess) {
    const err =
      confirmResult.status === 'fulfilled' ? confirmResult.value.error : confirmResult.reason
    payload.logger.error(`[Form] Confirmation email failed for ${extractedEmail}: ${err}`)
  }

  // Update submission flags
  await payload.update({
    collection: 'form-submissions',
    id: submission.id,
    data: {
      omnisendSynced: omnisendSuccess,
      notificationSent: shouldNotifyAdmins ? notifySuccess : false,
    },
    overrideAccess: true,
  })

  return { success: true, message: form.successMessage || '' }
}
