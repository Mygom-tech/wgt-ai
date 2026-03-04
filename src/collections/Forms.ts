import type { CollectionConfig } from 'payload'
import { createCollectionRevalidationHooks } from '@/lib/revalidation'
import { publicRead, adminAccess } from '@/lib/access'
import {
  TextField,
  PhoneField,
  TextareaField,
  SelectField,
  CheckboxField,
} from '@/blocks/form-fields'

const revalidation = createCollectionRevalidationHooks('forms', { revalidateAll: true })

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  access: {
    read: publicRead,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name for this form, e.g. "Registration Form"',
      },
    },
    {
      name: 'emailField',
      type: 'group',
      label: 'Email Field (always included)',
      admin: {
        description: 'Every form includes an email field. Customize its label and placeholder.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'Email',
          required: true,
        },
        {
          name: 'placeholder',
          type: 'text',
          localized: true,
          admin: {
            placeholder: 'e.g. your@email.com',
          },
        },
      ],
    },
    {
      name: 'fields',
      type: 'blocks',
      label: 'Additional Fields',
      blocks: [TextField, PhoneField, TextareaField, SelectField, CheckboxField],
    },
    {
      name: 'mailerliteGroupId',
      type: 'text',
      admin: {
        description: 'MailerLite group ID for subscriber syncing',
        position: 'sidebar',
      },
    },
    {
      name: 'successMessage',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Shown after successful form submission',
      },
    },
  ],
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
}
