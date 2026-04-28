import type { Block } from 'payload'
import { fieldNameDescription, validateFieldName } from './fieldName'

export const SelectField: Block = {
  slug: 'selectField',
  interfaceName: 'SelectFieldBlock',
  labels: {
    singular: 'Select Field',
    plural: 'Select Fields',
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
      name: 'required',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'options',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
