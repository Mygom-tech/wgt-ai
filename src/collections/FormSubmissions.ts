import type { CollectionConfig } from 'payload'
import { isSuperAdmin, submissionsByLocale, superAdminOnly } from '@/lib/access'
import { locales } from '@/i18n/locales'
import { countFailedSubmissions, resyncFailedSubmissions } from '@/lib/omnisend-backfill'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'locale', 'form', 'omnisendSynced', 'createdAt'],
    group: 'Submissions',
    components: {
      beforeListTable: ['@/components/admin/ResyncOmnisendButton#ResyncOmnisendButton'],
    },
  },
  access: {
    create: () => true,
    read: submissionsByLocale,
    update: () => false,
    delete: superAdminOnly,
  },
  endpoints: [
    {
      // GET /api/form-submissions/omnisend-failed-count — how many syncs currently failed.
      path: '/omnisend-failed-count',
      method: 'get',
      handler: async (req) => {
        if (!isSuperAdmin(req.user)) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        try {
          const failed = await countFailedSubmissions(req.payload)
          return Response.json({ failed })
        } catch (error) {
          req.payload.logger.error(`[omnisend-failed-count] Failed to count. ${error}`)
          return Response.json({ error: 'Count failed' }, { status: 500 })
        }
      },
    },
    {
      // POST /api/form-submissions/resync-omnisend — re-send one batch of failed syncs.
      path: '/resync-omnisend',
      method: 'post',
      handler: async (req) => {
        if (!isSuperAdmin(req.user)) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        try {
          const result = await resyncFailedSubmissions(req.payload)
          return Response.json(result)
        } catch (error) {
          req.payload.logger.error(`[resync-omnisend] Failed to run Omnisend backfill. ${error}`)
          return Response.json({ error: 'Backfill failed' }, { status: 500 })
        }
      },
    },
  ],
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: locales.map((l) => ({ label: l.label, value: l.code })),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'submissionData',
      type: 'json',
      required: true,
    },
    {
      name: 'email',
      type: 'text',
      index: true,
      admin: {
        description: 'Extracted from submission for search',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Extracted from submission for display',
      },
    },
    {
      name: 'omnisendSynced',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notificationSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
