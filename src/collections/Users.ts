import type { CollectionConfig } from 'payload'
import { locales } from '@/i18n/locales'
import {
  usersAccess,
  usersCreateAccess,
  usersDeleteAccess,
  superAdminFieldAccess,
} from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'assignedLocales', 'updatedAt'],
  },
  auth: true,
  access: {
    read: usersAccess,
    create: usersCreateAccess,
    update: usersAccess,
    delete: usersDeleteAccess,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'country-admin',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Country Admin', value: 'country-admin' },
      ],
      access: {
        update: superAdminFieldAccess,
      },
      admin: {
        description: 'Super Admins can edit all content in all languages. Country Admins can only edit content in their assigned languages.',
        position: 'sidebar',
      },
    },
    {
      name: 'assignedLocales',
      type: 'select',
      hasMany: true,
      options: locales.map((l) => ({ label: l.label, value: l.code })),
      access: {
        update: superAdminFieldAccess,
      },
      admin: {
        description: 'Which countries/languages this admin can manage. Only applies to Country Admins.',
        condition: (data) => data?.role === 'country-admin',
      },
    },
  ],
}
