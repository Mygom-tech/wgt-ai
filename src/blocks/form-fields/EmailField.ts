import type { Block } from 'payload'

export const EmailField: Block = {
  slug: 'emailField',
  interfaceName: 'EmailFieldBlock',
  labels: {
    singular: 'Email Field',
    plural: 'Email Fields',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'placeholder',
      type: 'text',
      localized: true,
    },
    {
      name: 'required',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
