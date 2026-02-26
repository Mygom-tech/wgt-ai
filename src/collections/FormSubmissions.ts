import type { CollectionConfig } from 'payload'
import { submissionsByLocale, superAdminOnly } from '@/lib/access'
import { locales } from '@/i18n/locales'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'locale', 'form', 'mailerliteSynced', 'createdAt'],
    group: 'Submissions',
  },
  access: {
    create: () => true,
    read: submissionsByLocale,
    update: () => false,
    delete: superAdminOnly,
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: locales.map((l) => ({ label: l.label, value: l.code })),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'submissionData',
      type: 'json',
      required: true,
    },
    {
      name: 'email',
      type: 'text',
      index: true,
      admin: {
        description: 'Extracted from submission for search',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Extracted from submission for display',
      },
    },
    {
      name: 'mailerliteSynced',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notificationSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
