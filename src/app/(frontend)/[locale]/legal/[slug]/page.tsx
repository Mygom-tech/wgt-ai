import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { JsonLd } from '@/components/JsonLd'
import { queryBySlug, queryCollection, getSiteUrl } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { generateBreadcrumbJsonLd, buildAlternateLanguages } from '@/lib/generateMeta'
import { defaultLocale, getHtmlLang, type LocaleCode } from '@/i18n/locales'
import { setRequestLocale } from 'next-intl/server'
import type { LegalPage } from '@/payload-types'
import type { LexicalRootData } from '@/components/RichTextRenderer'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const enabledLocales = await getEnabledLocales()
  const result = await queryCollection('legal-pages', {
    where: { status: { equals: 'published' } },
    limit: 100,
  })

  return result.docs.flatMap((doc) =>
    enabledLocales.map((locale) => ({ locale, slug: doc.slug })),
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = await queryBySlug('legal-pages', slug, { locale: locale as LocaleCode })

  if (!doc) {
    return { title: 'Not Found' }
  }

  const [settings, enabledLocales] = await Promise.all([
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
  ])
  const siteName = settings.siteName || 'Jarune'
  const siteUrl = getSiteUrl(settings)

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/legal/${slug}`
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, `/legal/${slug}`)

  return {
    title: `${doc.title} | ${siteName}`,
    robots: { index: false, follow: true },
    openGraph: {
      title: doc.title,
      url,
      siteName,
      type: 'website',
      locale: getHtmlLang(locale),
    },
    alternates: {
      canonical: url,
      languages,
    },
  }
}

export default async function LegalPageRoute({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [doc, settings] = await Promise.all([
    queryBySlug('legal-pages', slug, { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
  ])

  if (!doc) notFound()

  const page = doc as LegalPage
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    siteName,
    siteUrl,
    page.title,
    `/legal/${page.slug}`,
  )

  const updatedAt = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Section variant="light">
        <GridLines columns={16} rows={12} className="opacity-40" />
        <Container size="prose">
          <Eyebrow label={page.eyebrow || 'Legal'} color="primary" />
          <h1 className="mt-4 text-title font-heading">{page.title}</h1>
          {updatedAt && (
            <time
              className="mt-3 block text-sm text-muted"
              dateTime={page.updatedAt ?? undefined}
            >
              Last updated: {updatedAt}
            </time>
          )}
          <hr className="my-8 border-foreground/10" />
          <RichTextRenderer
            data={page.content as LexicalRootData | null | undefined}
            className="prose-content"
          />
        </Container>
      </Section>
    </>
  )
}
