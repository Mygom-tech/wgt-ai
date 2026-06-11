type DataLayerEvent = {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

export function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
}

export const GTM_EVENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/

export function validateGtmEventName(value: string | null | undefined): true | string {
  if (!value) return true
  return GTM_EVENT_NAME_PATTERN.test(value)
    ? true
    : 'Enter a valid GA4 event name: start with a letter, use only letters, numbers and underscores, no spaces, max 40 characters (e.g. registration_success).'
}
