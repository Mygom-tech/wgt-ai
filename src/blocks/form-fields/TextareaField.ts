import type { Block } from 'payload'
import { fieldNameDescription, validateFieldName } from './fieldName'

export const TextareaField: Block = {
  slug: 'textareaField',
  interfaceName: 'TextareaFieldBlock',
  labels: {
    singular: 'Textarea Field',
    plural: 'Textarea Fields',
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
      name: 'maxLength',
      type: 'number',
    },
  ],
}
