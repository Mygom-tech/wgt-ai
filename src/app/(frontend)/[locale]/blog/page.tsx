import type { Metadata } from 'next'
import Link from 'next/link'
import NextImage from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { JsonLd } from '@/components/JsonLd'
import { CTA } from '@/sections/CTA'
import { LoadMoreButton } from './LoadMoreButton'
import { queryCollection, queryGlobal, getSiteUrl } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { buildAlternateLanguages, generateBreadcrumbJsonLd } from '@/lib/generateMeta'
import { getTwitterHandle } from '@/lib/socialUtils'
import { defaultLocale, getHtmlLang, type LocaleCode } from '@/i18n/locales'
import type { BlogPost, Image } from '@/payload-types'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  const enabledLocales = await getEnabledLocales()
  return enabledLocales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [blogPageData, settings, enabledLocales] = await Promise.all([
    queryGlobal('blog-page', { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
  ])
  const siteName = settings.siteName || 'Jarune'
  const siteUrl = getSiteUrl(settings)
  const heading = blogPageData?.heading || siteName
  const title = `${heading} | ${siteName}`
  const description =
    blogPageData?.subtitle || settings.defaultMeta?.description || ''

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/blog`
  const languages = buildAlternateLanguages(enabledLocales, siteUrl, '/blog')

  const ogImage = settings.defaultMeta?.image
  const ogImageObj = ogImage && typeof ogImage === 'object' ? ogImage : null
  const ogImages = ogImageObj?.url
    ? [{ url: ogImageObj.url, alt: ogImageObj.alt || title, width: ogImageObj.width ?? 1200, height: ogImageObj.height ?? 630 }]
    : []

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: 'website',
      locale: getHtmlLang(locale),
      ...(ogImages.length ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: getTwitterHandle(settings.socialLinks),
      title,
      description,
      ...(ogImages.length ? { images: ogImages.map((img) => img.url) } : {}),
    },
    alternates: {
      canonical: url,
      languages,
    },
  }
}

function BlogCard({ post, locale }: { post: BlogPost; locale: string }) {
  const image = typeof post.keyVisual === 'object' ? (post.keyVisual as Image) : null
  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article>
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="group block overflow-hidden rounded-sm border border-foreground/[0.08] bg-surface transition-colors hover:border-foreground/[0.15]"
      >
        {image?.url && (
          <div className="aspect-video overflow-hidden">
            <NextImage
              src={image.url}
              alt={image.alt || ''}
              width={image.width ?? 800}
              height={image.height ?? 450}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        <div className="p-6">
          <time className="text-xs uppercase tracking-[0.15em] text-muted" dateTime={post.date}>
            {formattedDate}
          </time>
          <h2 className="mt-2 text-lg font-heading font-medium leading-snug text-foreground">
            {post.title}
          </h2>
        </div>
      </Link>
    </article>
  )
}

export default async function BlogListPage({ params }: Props) {
  const { locale } = await params

  const [result, blogPageData, newsletterData, settings, t] = await Promise.all([
    queryCollection('blog-posts', {
      where: {
        status: { equals: 'published' },
        locales: { contains: locale },
      },
      sort: '-date',
      limit: 4,
      locale: locale as LocaleCode,
      depth: 1,
    }),
    queryGlobal('blog-page', { locale: locale as LocaleCode }),
    queryGlobal('newsletter', { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
    getTranslations({ locale, namespace: 'blog' }),
  ])

  const posts = result.docs as BlogPost[]
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'

  const heading = blogPageData?.heading || siteName
  const eyebrow = blogPageData?.eyebrow
  const subtitle = blogPageData?.subtitle
  const backgroundWord = blogPageData?.backgroundWord

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    siteName,
    siteUrl,
    heading,
    `${localePrefix}/blog`,
  )

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Section variant="light">
        <GridLines columns={16} rows={12} className="opacity-40" />

        {backgroundWord && (
          <div
            className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none select-none z-0"
            aria-hidden="true"
            data-nosnippet
          >
            <span
              className="font-heading font-black uppercase text-foreground/[0.03] tracking-[-0.05em] leading-none"
              style={{ fontSize: 'clamp(10rem, 25vw, 30rem)' }}
            >
              {backgroundWord}
            </span>
          </div>
        )}

        <Container size="xl" className="relative z-10">
          <header className="flex flex-col gap-5 lg:gap-6 mb-16 lg:mb-20 max-w-3xl">
            {eyebrow && <Eyebrow label={eyebrow} color="primary" />}

            <h1
              className="text-[clamp(2.5rem,6vw,5rem)] font-medium uppercase leading-[0.95] tracking-[-0.04em] font-heading text-foreground"
            >
              {heading}
            </h1>

            {subtitle && (
              <>
                <hr className="w-full h-[1px] bg-foreground/10 border-none" />
                <p className="text-body-lg font-medium text-foreground/60 leading-relaxed tracking-tight max-w-xl">
                  {subtitle}
                </p>
              </>
            )}
          </header>

          {posts.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-body-lg text-foreground/40 tracking-wide">
                {t('noPostsYet')}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 list-none p-0" role="list">
              {posts.map((post) => (
                <li key={post.id}>
                  <BlogCard post={post} locale={locale} />
                </li>
              ))}
            </ul>
          )}

          {result.hasNextPage && <LoadMoreButton locale={locale} />}
        </Container>
      </Section>

      {newsletterData?.heading && <CTA newsletter={newsletterData} />}
    </>
  )
}
