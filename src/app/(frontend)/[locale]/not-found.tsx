import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { NotFoundHero } from '@/components/NotFoundHero'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'meta' })

  return {
    title: t('notFound'),
    robots: { index: false, follow: true },
  }
}

export default async function NotFound() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'notFound' })

  return (
    <NotFoundHero
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      subtitle={t('subtitle')}
      cta={t('cta')}
    />
  )
}
