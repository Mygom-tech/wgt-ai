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
import { validateGtmEventName } from '@/lib/gtm'

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
      label: 'Email Field (always rendered on step 1)',
      admin: {
        description:
          'Every form includes an email field. It is always shown on the first step. Customize its label and placeholder.',
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
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description:
          'Forms are split into steps. With one step the form renders as a single page; with multiple steps a wizard with progress indicator and Previous/Next buttons is rendered. Field names must be unique across all steps.',
      },
      validate: (value: unknown) => {
        const steps =
          (value as Array<{ fields?: Array<{ name?: string }> }> | null | undefined) ?? []
        const seen = new Map<string, number>()

        for (let i = 0; i < steps.length; i++) {
          const fields = steps[i]?.fields ?? []

          for (const field of fields) {
            const name = field?.name
            if (!name) continue

            if (seen.has(name)) {
              return `Field name "${name}" is duplicated (also on step ${
                (seen.get(name) ?? 0) + 1
              }). Each field name must be unique across all steps.`
            }

            seen.set(name, i)
          }
        }
        return true
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          admin: {
            description: 'Optional step label shown in the indicator. Falls back to step number.',
          },
        },
        {
          name: 'fields',
          type: 'blocks',
          label: 'Fields',
          minRows: 1,
          required: true,
          blocks: [TextField, PhoneField, TextareaField, SelectField, CheckboxField],
          admin: {
            description: 'Each step must contain at least one field.',
          },
        },
      ],
    },
    {
      name: 'omnisendTag',
      type: 'text',
      admin: {
        description:
          'Optional Omnisend tag applied to contacts from this form (e.g. "registration"). All submissions also get a "source:form-submission" tag automatically. Leave empty to use only the source tag.',
        position: 'sidebar',
      },
    },
    {
      name: 'subscribeOnSubmit',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'When ON, every submission of this form adds the contact to the Omnisend marketing list (subscribed). When OFF, the contact is still saved and tagged in Omnisend, but their subscribe status is left untouched — an already-subscribed person stays subscribed, a new contact is not opted in. Leave OFF unless this form is an explicit marketing opt-in.',
      },
    },
    {
      name: 'gtmEventName',
      type: 'text',
      validate: validateGtmEventName,
      admin: {
        position: 'sidebar',
        description:
          'Optional. dataLayer event pushed to GTM when this form is submitted successfully (e.g. "registration_success"). Must EXACTLY match the Custom Event trigger configured in GTM, or nothing fires. Leave empty for no event. Avoid reusing the same name across forms unless you want them counted together.',
      },
    },
    {
      name: 'notifyAdmin',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Email country/super admins on each submission. Submissions are always saved in the CMS regardless.',
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
