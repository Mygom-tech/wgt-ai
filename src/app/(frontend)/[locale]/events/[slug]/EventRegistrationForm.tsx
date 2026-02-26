'use client'

import { FormRenderer } from '@/components/forms/FormRenderer'
import type { Form } from '@/payload-types'

type EventRegistrationFormProps = {
  form: Form
  submitAction: (rawData: Record<string, string | boolean>) => Promise<{
    success: boolean
    message?: string
    errors?: Record<string, string>
  }>
}

export function EventRegistrationForm({ form, submitAction }: EventRegistrationFormProps) {
  return <FormRenderer form={form} submitAction={submitAction} variant="dark" />
}
