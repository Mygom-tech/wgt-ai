'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, type LocaleCode } from '@/i18n/locales'

type HeaderProps = {
  enabledLocales: LocaleCode[]
}

export function Header({ enabledLocales }: HeaderProps) {
  const t = useTranslations('header')
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const availableLocales = locales.filter((l) => enabledLocales.includes(l.code))

  function handleLocaleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value as LocaleCode
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <header>
      <nav>
        <label>
          {t('language')}
          <select value={currentLocale} onChange={handleLocaleChange}>
            {availableLocales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.label}
              </option>
            ))}
          </select>
        </label>
      </nav>
    </header>
  )
}
