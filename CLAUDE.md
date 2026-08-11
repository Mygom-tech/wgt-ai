# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Payload CMS 3.77 + Next.js 15 full-stack application using MongoDB. The admin panel and frontend coexist in one Next.js app via route groups.

## Commands

```bash
pnpm dev              # Start dev server
pnpm devsafe          # Dev with .next cache cleared first
pnpm build            # Production build (uses --max-old-space-size=8000)
pnpm lint             # ESLint via next lint
pnpm test             # Run all tests (integration then e2e)
pnpm test:int         # Vitest integration tests only
pnpm test:e2e         # Playwright e2e tests only
pnpm generate:types   # Regenerate payload-types.ts after schema changes
pnpm generate:importmap  # Regenerate admin import map after creating/modifying components
pnpm payload          # Access Payload CLI directly
```

Validate TypeScript: `npx tsc --noEmit`

Run a single integration test: `pnpm test:int -- tests/int/api.int.spec.ts`

Run a single e2e test: `pnpm test:e2e -- tests/e2e/frontend.e2e.spec.ts`

## Architecture

**Route Groups** - Next.js App Router uses two route groups:
- `src/app/(frontend)/` - Public frontend (serves `/`)
- `src/app/(payload)/` - Payload admin panel (serves `/admin`), REST API (`/api/[...slug]`), GraphQL (`/api/graphql`)

**Payload Config** - `src/payload.config.ts` is the central configuration. Collections are defined in `src/collections/`. Currently: `Users` (auth-enabled) and `Media` (file uploads).

**Generated Files** - `src/payload-types.ts` contains auto-generated TypeScript types from collection schemas. `src/app/(payload)/admin/importMap.js` is auto-generated for admin components. Both are regenerated via their respective `generate:*` commands.

**Database** - MongoDB via `@payloadcms/db-mongodb` (mongooseAdapter). Connection string from `DATABASE_URL` env var.

**Rich Text** - Lexical editor (`@payloadcms/richtext-lexical`). The project-wide feature set lives in `src/payload.config.ts` and **replaces** the defaults (headings are limited to h2-h4). A field can override it with its own `editor: lexicalEditor({ features: [...] })` — see `landing-page.hero.heading`, which allows only paragraphs and bold. The frontend does **not** use `@payloadcms/richtext-lexical/react`; it serializes Lexical JSON with the hand-written `src/components/RichTextRenderer.tsx` (plus `src/lib/lexical-html.ts` for JSON-LD).

## Data Migrations

MongoDB, so there is no `payload migrate` infra. Schema changes that reshape stored data ship as one-off `tsx` scripts in `scripts/`:

```bash
pnpm tsx scripts/<name>.ts --dry   # inspect, writes nothing
pnpm tsx scripts/<name>.ts         # apply
```

Conventions: use the raw driver (`payload.db.connection.collection('globals')`) so the script runs against either code version; make it idempotent and warn loudly when data is already in the new shape; run once per environment (local → staging → prod) against a snapshot first; delete the script when every environment is done.

**Making a field `localized` does not migrate existing data** — Payload reshapes `field: value` into `field: { en: value }` and the old value becomes unreadable. Always pair that change with a script.

**Raw-driver writes bypass Payload hooks**, so `createGlobalRevalidationHook` never fires and `unstable_cache` (tagged, no TTL — `src/lib/payload-data.ts`) keeps serving pre-migration content. A script cannot call `revalidateTag` (it throws outside a Next request). After any migration, **save the affected global once in the admin** to bust the tag.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - MongoDB connection string (e.g., `mongodb://127.0.0.1/your-database-name`)
- `PAYLOAD_SECRET` - Secret key for Payload authentication

Cloudflare R2 storage (required for media uploads):
- `R2_ACCESS_KEY_ID` - R2 API token access key
- `R2_SECRET_ACCESS_KEY` - R2 API token secret
- `R2_BUCKET` - R2 bucket name
- `R2_ENDPOINT` - R2 endpoint (`https://ACCOUNT_ID.r2.cloudflarestorage.com`)
- `R2_PUBLIC_URL` - Public CDN URL for the bucket (e.g., `https://cdn.yourdomain.com`)

Optional:
- `NEXT_PUBLIC_SITE_URL` - Canonical site URL for SEO (defaults to `http://localhost:3000`)

## Key Payload CMS Rules

These are critical patterns from `AGENTS.md` and `.cursor/rules/`:

- **Always run `pnpm generate:types` after modifying collection schemas** - keeps `payload-types.ts` in sync.
- **Always run `pnpm generate:importmap` after creating or modifying admin components**.
- **Local API bypasses access control by default** - when passing a user, use `overrideAccess: false` explicitly.
- **Transaction safety** - always pass `req` to nested Payload operations inside hooks to maintain transaction context.
- **Prevent hook loops** - use `req.context` flags to guard against infinite recursion in hooks.
- **Access control** - ensure roles exist when adding access controls to collections or globals.

## Code Style

- Prettier: single quotes, no semicolons, trailing commas, 100 char width
- TypeScript strict mode with path aliases: `@/*` → `./src/*`, `@payload-config` → `./src/payload.config.ts`
- ESM modules (`"type": "module"` in package.json)

## Testing

- **Integration**: Vitest + React Testing Library + jsdom - files in `tests/int/**/*.int.spec.ts`
- **E2E**: Playwright (Desktop Chrome) - files in `tests/e2e/**/*.e2e.spec.ts`
- **Test helpers**: `tests/helpers/` contains `login.ts` and `seedUser.ts` for auth operations
- E2E tests expect dev server on `http://localhost:3000`
