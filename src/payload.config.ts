import { mongooseAdapter } from '@payloadcms/db-mongodb'
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  InlineCodeFeature,
  ParagraphFeature,
  HeadingFeature,
  AlignFeature,
  IndentFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  UnorderedListFeature,
  OrderedListFeature,
  ChecklistFeature,
  LinkFeature,
  RelationshipFeature,
  UploadFeature,
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Images } from './collections/Images'
import { Videos } from './collections/Videos'
import { LegalPages } from './collections/LegalPages'
import { Forms } from './collections/Forms'
import { FormSubmissions } from './collections/FormSubmissions'
import { Testimonials } from './collections/Testimonials'
import { BlogPosts } from './collections/BlogPosts'
import { Partners } from './collections/Partners'
import { FaqItems } from './collections/FaqItems'
import { Events } from './collections/Events'
import { SiteSettings } from './globals/SiteSettings'
import { LandingPage } from './globals/LandingPage'
import { Newsletter } from './globals/Newsletter'
import { ContactsPage } from './globals/ContactsPage'
import { BlogPage } from './globals/BlogPage'
import { EventsPage } from './globals/EventsPage'
import { seoConfig } from './plugins/seo'
import { fixSeoSidebar } from './plugins/fixSeoSidebar'
import { YouTubeBlock } from './blocks/YouTube'
import { locales, defaultLocale } from './i18n/locales'
import type { LocalizationConfig } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Images, Videos, LegalPages, BlogPosts, Events, Forms, FormSubmissions, Testimonials, Partners, FaqItems],
  globals: [SiteSettings, LandingPage, Newsletter, ContactsPage, BlogPage, EventsPage],
  editor: lexicalEditor({
    features: [
      // Formatting
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      InlineCodeFeature(),
      // Structure
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      AlignFeature(),
      IndentFeature(),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      // Lists
      UnorderedListFeature(),
      OrderedListFeature(),
      ChecklistFeature(),
      // Media & Relations
      UploadFeature(),
      LinkFeature(),
      RelationshipFeature(),
      // Blocks
      BlocksFeature({ blocks: [YouTubeBlock] }),
      // Tables
      EXPERIMENTAL_TableFeature(),
      // Toolbars
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  localization: {
    locales: locales.map((l) => ({
      code: l.code,
      label: l.label,
    })),
    defaultLocale,
    fallback: true,
  } satisfies LocalizationConfig,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        images: {
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            const publicUrl = process.env.R2_PUBLIC_URL
            if (!publicUrl) return `/images/${filename}`
            return prefix
              ? `${publicUrl}/${prefix}/${filename}`
              : `${publicUrl}/${filename}`
          },
          prefix: 'images',
        },
        videos: {
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            const publicUrl = process.env.R2_PUBLIC_URL
            if (!publicUrl) return `/videos/${filename}`
            return prefix
              ? `${publicUrl}/${prefix}/${filename}`
              : `${publicUrl}/${filename}`
          },
          prefix: 'videos',
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        endpoint: process.env.R2_ENDPOINT || '',
        region: 'auto',
        forcePathStyle: true,
      },
    }),
    seoConfig,
    fixSeoSidebar,
  ],
})
