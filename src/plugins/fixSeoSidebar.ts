import type { Config, Field, TabsField } from 'payload'

/**
 * The SEO plugin's `tabbedUI: true` wraps all collection fields into a tab,
 * but Payload only detects `position: 'sidebar'` at the top level.
 * This plugin runs after the SEO plugin and extracts sidebar fields
 * back out of tabs so they render in the sidebar correctly.
 */
export const fixSeoSidebar = (config: Config): Config => {
  return {
    ...config,
    collections: config.collections?.map((collection) => {
      const firstField = collection.fields?.[0]
      if (!firstField || !('type' in firstField) || firstField.type !== 'tabs') return collection

      const tabsField = firstField as TabsField
      const sidebarFields: Field[] = []

      const tabs = tabsField.tabs.map((tab) => ({
        ...tab,
        fields: tab.fields.filter((field) => {
          if ('admin' in field && field.admin?.position === 'sidebar') {
            sidebarFields.push(field)
            return false
          }
          return true
        }),
      }))

      if (sidebarFields.length === 0) return collection

      return {
        ...collection,
        fields: [...sidebarFields, { ...tabsField, tabs }, ...collection.fields.slice(1)],
      }
    }),
  }
}
