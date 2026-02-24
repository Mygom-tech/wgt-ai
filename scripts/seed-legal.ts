import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const legalPages = [
  {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    pageType: 'cookie-policy' as const,
    status: 'published' as const,
  },
  {
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    pageType: 'terms-and-conditions' as const,
    status: 'published' as const,
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    pageType: 'privacy-policy' as const,
    status: 'published' as const,
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const page of legalPages) {
    const existing = await payload.find({
      collection: 'legal-pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`Skipping "${page.title}" — already exists.`)
      continue
    }

    await payload.create({
      collection: 'legal-pages',
      data: page,
      context: { disableRevalidate: true },
    })
    console.log(`Created "${page.title}"`)
  }

  console.log('Done.')
  process.exit(0)
}

main()
