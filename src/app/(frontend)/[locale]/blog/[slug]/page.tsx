import type { Metadata } from 'next'
import Link from 'next/link'
import NextImage from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Article, BreadcrumbList, WithContext } from 'schema-dts'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { GridLines } from '@/components/ui/GridLines'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { JsonLd } from '@/components/JsonLd'
import { CTA } from '@/sections/CTA'
import { queryBySlug, queryCollection, queryGlobal, getSiteUrl } from '@/lib/payload-data'
import { getSiteSettings, getEnabledLocales } from '@/lib/getSiteSettings'
import { buildAlternateLanguages, resolveMedia } from '@/lib/generateMeta'
import { getTwitterHandle } from '@/lib/socialUtils'
import { getHtmlLang, defaultLocale, type LocaleCode } from '@/i18n/locales'
import type { BlogPost, Image } from '@/payload-types'
import type { LexicalRootData } from '@/components/RichTextRenderer'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const enabledLocales = await getEnabledLocales()
  const result = await queryCollection('blog-posts', {
    where: { status: { equals: 'published' } },
    limit: 100,
  })

  return result.docs.flatMap((doc) => {
    const post = doc as BlogPost
    const postLocales = post.locales ?? []
    return enabledLocales
      .filter((locale) => postLocales.includes(locale))
      .map((locale) => ({ locale, slug: post.slug }))
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = await queryBySlug('blog-posts', slug, {
    locale: locale as LocaleCode,
    depth: 2,
  })

  if (!doc) {
    return { title: 'Not Found' }
  }

  const post = doc as BlogPost
  const [settings, enabledLocales] = await Promise.all([
    getSiteSettings(locale as LocaleCode),
    getEnabledLocales(),
  ])
  const siteName = settings.siteName || 'Jarune'
  const siteUrl = getSiteUrl(settings)

  // SEO plugin fields with fallbacks
  const title = post.meta?.title || `${post.title} | ${siteName}`
  const description = post.meta?.description || ''
  const seoImage = resolveMedia(post.meta?.image as string | Image | null | undefined)
  const keyVisualImage = typeof post.keyVisual === 'object' ? (post.keyVisual as Image) : null
  const ogImage = seoImage || keyVisualImage
  const noIndex = (post.meta as Record<string, unknown>)?.noIndex ?? false
  const noFollow = (post.meta as Record<string, unknown>)?.noFollow ?? false
  const canonicalURL = (post.meta as Record<string, unknown>)?.canonicalURL as string | undefined

  const postLocales = post.locales ?? []
  const relevantLocales = enabledLocales.filter((l) => postLocales.includes(l))
  const languages = buildAlternateLanguages(relevantLocales, siteUrl, `/blog/${slug}`)

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/blog/${slug}`

  const ogImages = ogImage?.url
    ? [{
        url: ogImage.url,
        alt: ogImage.alt || post.title,
        width: ogImage.width ?? 1200,
        height: ogImage.height ?? 630,
      }]
    : []

  const robots: Metadata['robots'] = {}
  if (noIndex) robots.index = false
  if (noFollow) robots.follow = false

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      locale: getHtmlLang(locale),
      ...(ogImages.length ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: getTwitterHandle(settings.socialLinks),
      title: post.title,
      description,
      ...(ogImages.length ? { images: ogImages.map((img) => img.url) } : {}),
    },
    alternates: {
      canonical: canonicalURL || url,
      languages,
    },
    ...(noIndex || noFollow ? { robots } : {}),
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [doc, blogPageData, newsletterData, settings, t] = await Promise.all([
    queryBySlug('blog-posts', slug, { locale: locale as LocaleCode, depth: 2 }),
    queryGlobal('blog-page', { locale: locale as LocaleCode }),
    queryGlobal('newsletter', { locale: locale as LocaleCode }),
    getSiteSettings(locale as LocaleCode),
    getTranslations({ locale, namespace: 'blog' }),
  ])

  if (!doc) notFound()

  const post = doc as BlogPost
  const image = typeof post.keyVisual === 'object' ? (post.keyVisual as Image) : null
  const relatedPosts = (
    Array.isArray(post.relatedPosts)
      ? post.relatedPosts.filter(
          (p): p is BlogPost => typeof p === 'object' && p !== null && p.status === 'published',
        )
      : []
  ).slice(0, 3)
  const siteUrl = getSiteUrl(settings)
  const siteName = settings.siteName || 'Jarune'
  const blogHeading = blogPageData?.heading || siteName
  const blogEyebrow = blogPageData?.eyebrow

  const localePrefix = locale === defaultLocale ? '' : `/${locale}`
  const url = `${siteUrl}${localePrefix}/blog/${slug}`
  const description = post.meta?.description || ''

  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: siteUrl },
      { '@type': 'ListItem', position: 2, name: blogHeading, item: `${siteUrl}${localePrefix}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }

  const articleJsonLd: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    ...(description ? { description } : {}),
    url,
    datePublished: post.date,
    dateModified: post.updatedAt,
    ...(image?.url ? { image: image.url } : {}),
    author: { '@type': 'Organization', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: getHtmlLang(locale),
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={articleJsonLd} />
      <Section variant="light">
        <GridLines columns={16} rows={12} className="opacity-40" />
        <Container size="md">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center text-sm text-muted transition-colors hover:text-foreground"
          >
            {t('backToNews')}
          </Link>

          <article>
            <header className="max-w-[45rem] mt-8">
              {blogEyebrow && <Eyebrow label={blogEyebrow} color="primary" />}
              <h1
                className="mt-4 font-heading font-medium"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
              >
                {post.title}
              </h1>
              <time className="mt-3 block text-sm text-muted" dateTime={post.date}>
                {formattedDate}
              </time>
            </header>

            {image?.url && (
              <div className="mt-8 overflow-hidden rounded-sm">
                <NextImage
                  src={image.url}
                  alt={image.alt || post.title}
                  width={image.width ?? 1200}
                  height={image.height ?? 675}
                  className="w-full h-auto"
                  sizes="(max-width: 60rem) 100vw, 60rem"
                  priority
                />
              </div>
            )}

            <hr className="my-8 border-foreground/10" />
            <RichTextRenderer
              data={post.body as LexicalRootData | null | undefined}
              className="prose-content"
            />
          </article>

          <hr className="my-8 border-foreground/10" />

          <nav aria-label={t('backToNews')}>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center text-sm text-muted transition-colors hover:text-foreground"
            >
              {t('backToNews')}
            </Link>
          </nav>

          {relatedPosts.length > 0 && (
            <aside className="mt-16" aria-label={t('relatedPosts')}>
              <Eyebrow label={t('relatedPosts')} color="primary" />
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {relatedPosts.map((related) => {
                  const relatedImage =
                    typeof related.keyVisual === 'object' ? (related.keyVisual as Image) : null
                  const relatedDate = new Date(related.date).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  return (
                    <article key={related.id}>
                      <Link
                        href={`/${locale}/blog/${related.slug}`}
                        className="group block overflow-hidden rounded-sm border border-foreground/[0.08] bg-surface transition-colors hover:border-foreground/[0.15]"
                      >
                        {relatedImage?.url && (
                          <div className="aspect-video overflow-hidden">
                            <NextImage
                              src={relatedImage.url}
                              alt={relatedImage.alt || ''}
                              width={relatedImage.width ?? 800}
                              height={relatedImage.height ?? 450}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <time
                            className="text-xs uppercase tracking-[0.15em] text-muted"
                            dateTime={related.date}
                          >
                            {relatedDate}
                          </time>
                          <h3 className="mt-2 text-base font-heading font-medium leading-snug text-foreground">
                            {related.title}
                          </h3>
                        </div>
                      </Link>
                    </article>
                  )
                })}
              </div>
            </aside>
          )}
        </Container>
      </Section>

      {newsletterData?.heading && <CTA newsletter={newsletterData} />}
    </>
  )
}
