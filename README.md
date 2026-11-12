# Государственный архив Восточно-Казахстанской области

This repository contains a multilingual information portal for learning about the State Archive of East Kazakhstan Region and finding archive service information. It is a competition project and is not the archive’s official website.

**Рабочая публичная версия:** [altai-archive.vercel.app](https://altai-archive.vercel.app)

## Purpose

The project demonstrates a single public starting point for finding archive service information and exploring a searchable catalogue, regional history, branches, exhibitions, and news. It addresses the user task of navigating these kinds of materials from one clear interface. The four catalogue records currently included are illustrative examples, not real archive holdings.

## What is included

- Public pages for the catalog, document descriptions, history, atlas, branches, exhibitions, news, institutional information, and official service links.
- Archive-supplied commemorative calendars for 2022–2026 and a Russian-language institutional history timeline. The history is presented as educational content, distinct from an officially approved archive exhibition. Original wording is preserved, and discrepancies between calendar versions are flagged.
- Russian, Kazakh, and English interface; light/dark themes; responsive layout; an optional large-text accessibility mode.
- Search and filters over the included sample catalog. Sample records, illustrations, and exhibition copy are labelled as illustrative; they are not archival originals.
- Visitor registration, sign-in, password reset, and feedback code using Supabase Auth and the existing feedback table. These features remain disabled until the owner applies the reviewed migrations and configures Supabase, email delivery, CAPTCHA, and Redis.
- A role-checked staff interface and isolated local demonstration workflow. Production staff authentication and persistent document/file storage are not enabled.

## Technology

- Next.js 16.4.5 App Router, React 19, and TypeScript.
- Supabase Auth and the existing feedback table have integration code, but visitor authentication and feedback submission remain disabled until the required database, email, CAPTCHA, and server settings are configured and verified.
- Upstash Redis rate limiting is required for production assistant API requests; no AI provider credentials are included in this handoff.
- Vercel hosts the public read-only version. The current archive content store is filesystem-based and is not durable on Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The local public site works without external credentials. Keep `DEMO_READ_ONLY=true` unless testing in the isolated disposable demo. Never point the demo at production data. Build requires exact `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` values, for example:

```bash
APP_ORIGIN=https://altai-archive.example.test NEXT_PUBLIC_SITE_URL=https://altai-archive.example.test npm run build
```

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e:ai
npm run test:e2e:admin
```

## Important status

- `.data` and uploaded files use local filesystem storage and are not durable on Vercel. Keep administrative mutations read-only in hosted deployments.
- Supabase migrations under `supabase/migrations/` are local review artifacts; none were applied to the connected project during this work.
- No direct branch map is presented because current branch addresses and coordinates are not verified. A 2GIS address search is provided only for the main archive address listed by the government procurement portal.
- The legacy archive website timed out during review. Current legal name and direct address/email are cited in [official materials](docs/OFFICIAL_MATERIALS.md); no unverified branch phone numbers or personal email addresses are shown publicly.
- The archive supplied no standalone photographs or scans of archival holdings. The repository still uses SVG illustrations, which are labeled as illustrations; four catalogue cards remain illustrative examples. Supplied signed legal scans are not hosted publicly. See the [customer material inventory](docs/CUSTOMER_MATERIALS.md).

## Documentation

- [Administrator guide](docs/ADMIN_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment configuration](docs/DEPLOYMENT.md)
- [Security and access status](docs/SECURITY.md)
- [Data sources and image provenance](docs/DATA_SOURCES.md)
- [Project handover](docs/HANDOVER.md)
- [Official sources and content provenance](docs/OFFICIAL_MATERIALS.md)
- [Customer-supplied material inventory](docs/CUSTOMER_MATERIALS.md)
- [Feedback and Supabase setup](docs/FEEDBACK_SETUP.md)
- [Vercel readiness checklist](docs/VERCEL_DEPLOY_CHECKLIST.md)
- [Readiness matrix](docs/READINESS_MATRIX.md)

The company/customer provides the authoritative archive material, publication permissions, approved contacts, and production configuration before any live-content or write-enabled release.
