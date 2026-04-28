const FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/

export const fieldNameDescription =
  'URL-safe identifier. Letters, numbers, underscores and hyphens only. Must start with a letter or underscore. No dots, brackets, or spaces.'

export const validateFieldName = (value: unknown): true | string => {
  if (typeof value !== 'string' || value.length === 0) return true
  if (!FIELD_NAME_PATTERN.test(value)) {
    return 'Field name must start with a letter or underscore and contain only letters, numbers, underscores, and hyphens. No dots, brackets, or spaces.'
  }
  return true
}
