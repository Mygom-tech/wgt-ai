const FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/
const RESERVED_FIELD_NAMES = new Set(['email', '_hp'])

export const fieldNameDescription =
  'URL-safe identifier. Letters, numbers, underscores and hyphens only. Must start with a letter or underscore. No dots, brackets, or spaces. Reserved names: "email" (built-in email field) and "_hp" (honeypot).'

export const validateFieldName = (value: unknown): true | string => {
  if (typeof value !== 'string' || value.length === 0) return true
  if (RESERVED_FIELD_NAMES.has(value)) {
    return `Field name "${value}" is reserved and cannot be used. Reserved names: ${[...RESERVED_FIELD_NAMES].map((n) => `"${n}"`).join(', ')}.`
  }
  if (!FIELD_NAME_PATTERN.test(value)) {
    return 'Field name must start with a letter or underscore and contain only letters, numbers, underscores, and hyphens. No dots, brackets, or spaces.'
  }
  return true
}
