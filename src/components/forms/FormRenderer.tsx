'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FormField } from './FormField'
import { inputStyles, labelStyles, errorStyles, type FormVariant } from './styles'
import type { Form } from '@/payload-types'

type SubmitResult = {
  success: boolean
  message?: string
  errors?: Record<string, string>
}

type FormRendererProps = {
  form: Form
  submitAction: (rawData: Record<string, string | boolean>) => Promise<SubmitResult>
  variant?: FormVariant
}

function buildSchema(fields: NonNullable<Form['fields']>, t: ReturnType<typeof useTranslations>) {
  const shape: Record<string, z.ZodType> = {}

  // Built-in email field - always required
  shape['email'] = z.string().email({ message: t('invalidEmail') })

  for (const block of fields) {
    switch (block.blockType) {
      case 'textField':
      case 'selectField':
        shape[block.name] = block.required
          ? z.string().min(1, { message: t('required') })
          : z.string().optional()
        break

      case 'phoneField':
        shape[block.name] = block.required
          ? z.string().min(1, { message: t('required') })
          : z.string().optional()
        break

      case 'textareaField': {
        let schema = block.required
          ? z.string().min(1, { message: t('required') })
          : z.string()
        if (block.maxLength) {
          schema = schema.max(block.maxLength)
        }
        shape[block.name] = block.required ? schema : schema.optional()
        break
      }

      case 'checkboxField':
        shape[block.name] = block.required
          ? z.literal(true, { message: t('required') })
          : z.boolean().optional()
        break
    }
  }

  // Include honeypot field so Zod doesn't strip it
  shape['_hp'] = z.string().optional()

  return z.object(shape)
}

export function FormRenderer({ form, submitAction, variant = 'dark' }: FormRendererProps) {
  const t = useTranslations('registration')
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState('')

  const fields = form.fields ?? []
  const schema = buildSchema(fields, t)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = handleSubmit(async (data) => {
    setServerError('')

    const rawData = data as Record<string, string | boolean>
    const result = await submitAction(rawData)

    if (result.success) {
      setIsSuccess(true)
      setSuccessMessage(result.message ?? '')
      return
    }

    if (result.errors) {
      for (const [field, message] of Object.entries(result.errors)) {
        setError(field, { message })
      }
      return
    }

    setServerError(result.message ?? t('errorTitle'))
  })

  const input = inputStyles[variant]
  const label = labelStyles[variant]
  const error = errorStyles[variant]

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border border-primary/20 bg-primary/[0.05] p-10 sm:p-12 text-center rounded-[2px]"
      >
        <h3 className={`text-xl font-heading font-medium uppercase tracking-[-0.02em] mb-3 ${variant === 'dark' ? 'text-white' : 'text-foreground'}`}>
          {t('successTitle')}
        </h3>
        {successMessage && (
          <p className={`text-sm leading-relaxed ${variant === 'dark' ? 'text-white/50' : 'text-foreground/50'}`}>
            {successMessage}
          </p>
        )}
      </div>
    )
  }

  const emailLabel = form.emailField?.label || 'Email'
  const emailPlaceholder = form.emailField?.placeholder ?? undefined

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Honeypot */}
      <input
        {...register('_hp')}
        type="text"
        className="absolute -left-[9999px] w-0 h-0 overflow-hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        {/* Built-in email field - always first, always full width */}
        <div className="md:col-span-2">
          <label htmlFor="email" className={label}>
            {emailLabel}
            <span className="text-primary ml-1">*</span>
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            placeholder={emailPlaceholder}
            className={input}
            {...(errors.email
              ? { 'aria-invalid': true as const, 'aria-describedby': 'email-error' }
              : {})}
          />
          {errors.email && (
            <p id="email-error" role="alert" className={error}>
              {errors.email.message as string}
            </p>
          )}
        </div>

        {/* Dynamic fields from CMS */}
        {fields.map((block) => (
          <div
            key={block.id}
            className={
              block.blockType === 'textField' && block.width === 'half' ? '' : 'md:col-span-2'
            }
          >
            <FormField
              block={block}
              register={register}
              error={errors[block.name]?.message as string}
              variant={variant}
            />
          </div>
        ))}
      </div>

      {serverError && (
        <p
          role="alert"
          aria-live="assertive"
          className={`mt-6 border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[11px] uppercase tracking-[0.15em] rounded-[2px] ${variant === 'dark' ? 'text-red-400' : 'text-red-600'}`}
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-10 w-full border border-primary bg-primary px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.4em] text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px]"
      >
        {isSubmitting ? t('submitting') : t('submitButton')}
      </button>
    </form>
  )
}
