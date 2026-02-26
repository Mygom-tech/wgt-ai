'use client'

import type { FieldValues, UseFormRegister } from 'react-hook-form'
import type {
  TextFieldBlock,
  PhoneFieldBlock,
  TextareaFieldBlock,
  SelectFieldBlock,
  CheckboxFieldBlock,
} from '@/payload-types'
import {
  inputStyles,
  labelStyles,
  errorStyles,
  checkboxInput,
  checkboxLabel,
  selectArrow,
  type FormVariant,
} from './styles'

type FormFieldBlock =
  | TextFieldBlock
  | PhoneFieldBlock
  | TextareaFieldBlock
  | SelectFieldBlock
  | CheckboxFieldBlock

type FormFieldProps = {
  block: FormFieldBlock
  register: UseFormRegister<FieldValues>
  error?: string
  variant?: FormVariant
}

export function FormField({ block, register, error, variant = 'dark' }: FormFieldProps) {
  const input = inputStyles[variant]
  const label = labelStyles[variant]
  const fieldError = errorStyles[variant]
  const errorId = `${block.name}-error`
  const ariaProps = error
    ? { 'aria-invalid': true as const, 'aria-describedby': errorId }
    : {}

  if (block.blockType === 'checkboxField') {
    return (
      <div>
        <label className="group flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id={block.name}
            {...register(block.name)}
            className={checkboxInput[variant]}
            {...ariaProps}
          />
          <span className={checkboxLabel[variant]}>
            {block.label}
            {block.required && <span className="text-primary ml-1">*</span>}
          </span>
        </label>
        {error && (
          <p id={errorId} role="alert" className={fieldError}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={block.name} className={label}>
        {block.label}
        {block.required && <span className="text-primary ml-1">*</span>}
      </label>

      {block.blockType === 'textField' && (
        <input
          type="text"
          id={block.name}
          {...register(block.name)}
          placeholder={block.placeholder ?? undefined}
          className={input}
          {...ariaProps}
        />
      )}

      {block.blockType === 'phoneField' && (
        <input
          type="tel"
          id={block.name}
          {...register(block.name)}
          placeholder={block.placeholder ?? undefined}
          className={input}
          {...ariaProps}
        />
      )}

      {block.blockType === 'textareaField' && (
        <textarea
          id={block.name}
          {...register(block.name)}
          placeholder={block.placeholder ?? undefined}
          maxLength={block.maxLength ?? undefined}
          rows={4}
          className={input}
          {...ariaProps}
        />
      )}

      {block.blockType === 'selectField' && (
        <select
          id={block.name}
          {...register(block.name)}
          className={`${input} appearance-none bg-[length:12px] bg-[right_16px_center] bg-no-repeat`}
          style={{ backgroundImage: selectArrow[variant] }}
          {...ariaProps}
        >
          <option value="">&mdash;</option>
          {block.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {error && (
        <p id={errorId} role="alert" className={fieldError}>
          {error}
        </p>
      )}
    </div>
  )
}
