import type { Block } from 'payload'

export const PhoneField: Block = {
  slug: 'phoneField',
  interfaceName: 'PhoneFieldBlock',
  labels: {
    singular: 'Phone Field',
    plural: 'Phone Fields',
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
