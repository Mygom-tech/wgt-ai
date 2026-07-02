import type { Payload } from 'payload'
import { syncToOmnisend, OMNISEND_SOURCE_TAG } from './omnisend'
import { buildContactFields } from './omnisend-contact'

type SubmissionField = { field: string; value: string }

export type ResyncResult = {
  processed: number
  succeeded: number
  failed: number
  remaining: number
}

// Only re-sync explicitly-failed submissions (omnisendSynced === false). Pre-Omnisend records
// (null) are a different category and intentionally left out. Bounded per run to stay well
// within serverless time limits; the caller can run it again until `remaining` is 0.
const FAILED_WHERE = { omnisendSynced: { equals: false } } as const

/** Count submissions whose Omnisend sync previously failed. */
export async function countFailedSubmissions(payload: Payload): Promise<number> {
  const { totalDocs } = await payload.count({
    collection: 'form-submissions',
    where: FAILED_WHERE,
  })
  return totalDocs
}

/**
 * Re-send form submissions whose Omnisend sync previously failed. Rebuilds each contact from the
 * stored submission using the same field mapping as the live form action, then flips
 * `omnisendSynced` to true on success.
 */
export async function resyncFailedSubmissions(payload: Payload, limit = 25): Promise<ResyncResult> {
  const failed = await payload.find({
    collection: 'form-submissions',
    where: FAILED_WHERE,
    depth: 1, // populate the related form so we can read its Omnisend config
    limit,
    overrideAccess: true,
  })

  let succeeded = 0
  let failedCount = 0

  for (const submission of failed.docs) {
    try {
      const form = submission.form
      if (!form || typeof form !== 'object' || !submission.email) {
        failedCount++
        continue
      }

      const fields = (form.steps ?? []).flatMap((step) => step.fields ?? [])
      const submissionData = Array.isArray(submission.submissionData)
        ? (submission.submissionData as SubmissionField[])
        : []
      const rawData: Record<string, string> = {}
      for (const entry of submissionData) {
        if (entry && typeof entry.field === 'string') {
          rawData[entry.field] = entry.value ?? ''
        }
      }

      const { firstName, lastName, customProperties } = buildContactFields(
        fields,
        rawData,
        submission.locale,
        form.title,
        form.sendAllFieldsToOmnisend !== false,
      )

      const tags = [OMNISEND_SOURCE_TAG.form, form.omnisendTag].filter(
        (tag): tag is string => Boolean(tag),
      )

      const result = await syncToOmnisend({
        email: submission.email,
        status: form.subscribeOnSubmit ? 'subscribed' : undefined,
        firstName,
        lastName,
        tags,
        customProperties,
      })

      if (result.success) {
        await payload.update({
          collection: 'form-submissions',
          id: submission.id,
          data: { omnisendSynced: true },
          overrideAccess: true,
        })
        succeeded++
      } else {
        payload.logger.error(
          `[resyncFailedSubmissions] Failed to resync submission ${submission.id}. ${result.error}`,
        )
        failedCount++
      }
    } catch (error) {
      payload.logger.error(
        `[resyncFailedSubmissions] Failed to resync submission ${submission.id}. ${error}`,
      )
      failedCount++
    }
  }

  const remaining = await payload.count({ collection: 'form-submissions', where: FAILED_WHERE })

  return {
    processed: failed.docs.length,
    succeeded,
    failed: failedCount,
    remaining: remaining.totalDocs,
  }
}
