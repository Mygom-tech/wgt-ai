import type { Block } from 'payload'
import { fieldNameDescription, validateFieldName } from './fieldName'

export const TextField: Block = {
  slug: 'textField',
  interfaceName: 'TextFieldBlock',
  labels: {
    singular: 'Text Field',
    plural: 'Text Fields',
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
      validate: validateFieldName,
      admin: {
        description: fieldNameDescription,
      },
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
    {
      name: 'width',
      type: 'select',
      options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Half Width', value: 'half' },
      ],
      defaultValue: 'full',
    },
  ],
}
