export const defaultLocale = 'en'

export const locales = [
  { code: 'en', htmlLang: 'en', label: 'English' },
  { code: 'bg', htmlLang: 'bg', label: 'Bulgaria' },
  { code: 'cz', htmlLang: 'cs', label: 'Czechia' },
  { code: 'lv', htmlLang: 'lv', label: 'Latvia' },
  { code: 'lt', htmlLang: 'lt', label: 'Lithuania' },
  { code: 'md', htmlLang: 'ro-MD', label: 'Moldova' },
  { code: 'pl', htmlLang: 'pl', label: 'Poland' },
  { code: 'ro', htmlLang: 'ro', label: 'Romania' },
] as const

export type LocaleCode = (typeof locales)[number]['code']
export const localeCodes = locales.map((l) => l.code)

export function isValidLocale(code: string): code is LocaleCode {
  return (localeCodes as readonly string[]).includes(code)
}

export function getHtmlLang(code: string): string {
  return locales.find((l) => l.code === code)?.htmlLang ?? code
}
