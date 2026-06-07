'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRef, useState } from 'react'
import { FormField } from './FormField'
import { StepIndicator } from './StepIndicator'
import { inputStyles, labelStyles, errorStyles, type FormVariant } from './styles'
import { pushToDataLayer } from '@/lib/gtm'
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

type FormStep = NonNullable<Form['steps']>[number]
type FieldBlock = NonNullable<FormStep['fields']>[number]

function buildShape(fields: FieldBlock[], t: ReturnType<typeof useTranslations>) {
  const shape: Record<string, z.ZodType> = {}

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
        let schema = block.required ? z.string().min(1, { message: t('required') }) : z.string()
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

  return shape
}

function buildSchema(fields: FieldBlock[], t: ReturnType<typeof useTranslations>) {
  const shape = buildShape(fields, t)
  shape['email'] = z.string().email({ message: t('invalidEmail') })
  shape['_hp'] = z.string().optional()
  return z.object(shape)
}

export function FormRenderer({ form, submitAction, variant = 'dark' }: FormRendererProps) {
  const t = useTranslations('registration')
  const locale = useLocale()
  const hasTrackedRef = useRef(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState('')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const steps: FormStep[] = form.steps ?? []
  const totalSteps = steps.length
  const isMultiStep = totalSteps > 1
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1
  const currentStepFields: FieldBlock[] = steps[currentStepIndex]?.fields ?? []

  const allFields: FieldBlock[] = steps.flatMap((s) => s.fields ?? [])
  const schema = buildSchema(allFields, t)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    shouldUnregister: false,
  })

  const onSubmit = handleSubmit(async (data) => {
    setServerError('')

    const rawData = data as Record<string, string | boolean>
    const result = await submitAction(rawData)

    if (result.success) {
      if (form.gtmEventName && !rawData._hp && !hasTrackedRef.current) {
        hasTrackedRef.current = true
        pushToDataLayer({ event: form.gtmEventName, language: locale })
      }

      setIsSuccess(true)
      setSuccessMessage(result.message ?? '')
      return
    }

    if (result.errors) {
      for (const [field, message] of Object.entries(result.errors)) {
        setError(field, { message })
      }

      const firstErrorField = Object.keys(result.errors)[0]

      if (firstErrorField) {
        for (let i = 0; i < steps.length; i++) {
          const stepFields = steps[i]?.fields ?? []
          const hasField =
            firstErrorField === 'email'
              ? i === 0
              : stepFields.some((b) => b.name === firstErrorField)

          if (hasField) {
            setCurrentStepIndex(i)
            break
          }
        }
      }
      return
    }

    setServerError(result.message ?? t('errorTitle'))
  })

  function handleNext(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    const stepShape = buildShape(currentStepFields, t)
    if (isFirstStep) {
      stepShape['email'] = z.string().email({ message: t('invalidEmail') })
    }
    const stepSchema = z.object(stepShape)

    const allValues = getValues()
    const stepValues: Record<string, unknown> = {}

    for (const name of Object.keys(stepShape)) {
      stepValues[name] = allValues[name]
    }

    for (const name of Object.keys(stepShape)) {
      clearErrors(name)
    }

    const result = stepSchema.safeParse(stepValues)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldName = String(issue.path[0])
        setError(fieldName, { message: issue.message })
      }

      return
    }

    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1))
  }

  function handlePrevious() {
    setCurrentStepIndex((i) => Math.max(0, i - 1))
  }

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
        <h3
          className={`text-xl font-heading font-medium uppercase tracking-[-0.02em] mb-3 ${
            variant === 'dark' ? 'text-white' : 'text-foreground'
          }`}
        >
          {t('successTitle')}
        </h3>
        {successMessage && (
          <p
            className={`text-sm leading-relaxed ${
              variant === 'dark' ? 'text-white/50' : 'text-foreground/50'
            }`}
          >
            {successMessage}
          </p>
        )}
      </div>
    )
  }

  const emailLabel = form.emailField?.label || 'Email'
  const emailPlaceholder = form.emailField?.placeholder ?? undefined

  const submitButtonClasses =
    'flex-1 border border-secondary bg-secondary px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.4em] text-foreground transition-all hover:border-primary hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px]'

  const previousButtonClasses = cnVariant(
    variant,
    'flex-1 border border-white/20 bg-transparent px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.4em] text-white transition-colors hover:border-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-[2px]',
    'flex-1 border border-foreground/20 bg-transparent px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.4em] text-foreground transition-colors hover:border-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-[2px]',
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Honeypot */}
      <input
        {...register('_hp')}
        type="text"
        aria-label="Leave this field empty"
        className="absolute -left-[9999px] w-0 h-0 overflow-hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />

      {isMultiStep && <StepIndicator steps={steps} current={currentStepIndex} variant={variant} />}

      <div key={currentStepIndex} className="animate-step-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {isFirstStep && (
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
          )}

          {currentStepFields.map((block) => (
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
      </div>

      {serverError && (
        <p
          role="alert"
          aria-live="assertive"
          className={`mt-6 border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[11px] uppercase tracking-[0.15em] rounded-[2px] ${
            variant === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}
        >
          {serverError}
        </p>
      )}

      {isMultiStep ? (
        <div className="mt-10 flex gap-4">
          <button
            key="step-prev"
            type="button"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={previousButtonClasses}
          >
            {t('previous')}
          </button>
          {isLastStep ? (
            <button
              key="step-submit"
              type="submit"
              disabled={isSubmitting}
              className={submitButtonClasses}
            >
              {isSubmitting ? t('submitting') : t('submitButton')}
            </button>
          ) : (
            <button
              key="step-next"
              type="button"
              onClick={handleNext}
              className={submitButtonClasses}
            >
              {t('next')}
            </button>
          )}
        </div>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-10 w-full border border-secondary bg-secondary px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.4em] text-foreground transition-all hover:border-primary hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-[2px]"
        >
          {isSubmitting ? t('submitting') : t('submitButton')}
        </button>
      )}
    </form>
  )
}

function cnVariant(variant: FormVariant, dark: string, light: string): string {
  return variant === 'dark' ? dark : light
}
