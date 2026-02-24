export const defaultLocale = 'en'

export const locales = [
  { code: 'en', htmlLang: 'en', label: 'English' },
  { code: 'lt', htmlLang: 'lt', label: 'Lithuanian' },
  { code: 'lv', htmlLang: 'lv', label: 'Latvian' },
  { code: 'cs', htmlLang: 'cs', label: 'Czech' },
  { code: 'ro', htmlLang: 'ro', label: 'Romanian' },
  { code: 'bg', htmlLang: 'bg', label: 'Bulgarian' },
  { code: 'md', htmlLang: 'ro-MD', label: 'Moldovan' },
  { code: 'pl', htmlLang: 'pl', label: 'Polish' },
] as const

export type LocaleCode = (typeof locales)[number]['code']
export const localeCodes = locales.map((l) => l.code)

export function getHtmlLang(code: string): string {
  return locales.find((l) => l.code === code)?.htmlLang ?? code
}
