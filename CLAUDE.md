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

**Rich Text** - Lexical editor (`@payloadcms/richtext-lexical`).

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
