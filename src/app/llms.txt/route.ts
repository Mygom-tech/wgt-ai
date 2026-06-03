import { getPayload } from 'payload'
import config from '@payload-config'
import { defaultLocale } from '@/i18n/locales'

export const revalidate = 3600

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  let siteName = 'MYGOM Academy'
  let blogSlugs: string[] = []
  let legalSlugs: { slug: string; title: string }[] = []

  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    siteName = (settings.siteName as string) || siteName

    const blogs = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      select: { slug: true, title: true },
      limit: 0,
    })
    blogSlugs = blogs.docs
      .filter((p) => p.slug)
      .map((p) => `- [${p.title}](${siteUrl}/blog/${p.slug})`)

    const legals = await payload.find({
      collection: 'legal-pages',
      where: { status: { equals: 'published' } },
      select: { slug: true, title: true },
      limit: 0,
      locale: defaultLocale,
    })
    legalSlugs = legals.docs
      .filter((d) => d.slug && d.title)
      .map((d) => ({ slug: d.slug!, title: d.title }))
  } catch {
    // Fallback to static content if CMS unavailable
  }

  const lines = [
    `# ${siteName}`,
    '',
    `> ${siteName} is a free AI education platform offering the Google AI Professional Certificate course across Central and Eastern Europe. The program teaches practical AI skills — prompt engineering, automation, data analysis — to professionals, students, career changers, and public sector workers. Available in 8 languages: English, Lithuanian, Latvian, Czech, Romanian, Bulgarian, Romanian (Moldova), and Polish.`,
    '',
    `The platform is operated in partnership with Google and Coursera. All courses are free of charge. Participants receive an official Google certificate upon completion.`,
    '',
    '## Main Pages',
    '',
    `- [Homepage](${siteUrl}): Program overview, skills taught, how the program works, who can join, registration form, partner logos, and testimonials`,
    `- [Blog](${siteUrl}/blog): Articles about AI education, program updates, and industry insights`,
    `- [Events](${siteUrl}/events): Upcoming and past workshops, webinars, and meetups with registration and calendar integration`,
    `- [FAQ](${siteUrl}/faq): Frequently asked questions about the program, enrollment, and certification`,
    `- [Contact](${siteUrl}/contacts): Contact form, support and partnership email addresses`,
    '',
  ]

  if (blogSlugs.length > 0) {
    lines.push('## Blog Posts', '', ...blogSlugs, '')
  }

  if (legalSlugs.length > 0) {
    lines.push(
      '## Legal',
      '',
      ...legalSlugs.map(
        (d) => `- [${d.title}](${siteUrl}/legal/${d.slug})`,
      ),
      '',
    )
  }

  lines.push(
    '## Optional',
    '',
    `- [Sitemap](${siteUrl}/sitemap.xml): Full XML sitemap with all pages and locale alternates`,
    '',
  )

  const body = lines.join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
