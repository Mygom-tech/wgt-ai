import type { Block } from 'payload'

export const CheckboxField: Block = {
  slug: 'checkboxField',
  interfaceName: 'CheckboxFieldBlock',
  labels: {
    singular: 'Checkbox Field',
    plural: 'Checkbox Fields',
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
      name: 'required',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
