# Archive information portal architecture

## Application

- Next.js 16 App Router and React 19. Route handlers are the HTTP boundary; the public catalog, exhibitions, news, atlas, and branch directory are static TypeScript/JSON data.
- `components/` contains the portal shell, page UI, localization, themes, accessible text preference, and staff workspace. RU/KK/EN strings are in `locales/messages.ts` and page-level dictionaries.
- Sample catalog records, news, exhibitions, atlas points, and local SVG illustrations are explicitly illustrative; they are not archive originals.
- Supabase Auth SSR clients and visitor/feedback route code are present but disabled by feature flags. The local visitor and staff SQL migrations were not applied remotely. Real SMTP, CAPTCHA, Redis and Supabase Auth have not been verified.
- `public.feedback_messages` is an existing separate Supabase table with private RLS. Feedback code checks a verified session and only returns success after a confirmed insert. The route is unavailable until configured.
- Legacy administrative documents, staff accounts, sessions, audit, and uploads use `.data/archive-store.json` and `.data/uploads`. This is local filesystem storage and not durable or suitable for write-enabled Vercel deployments.
- `lib/archive-auth.ts` contains the existing role matrix and server-side authorization. Local staff login is a demonstration; keep `DEMO_READ_ONLY=true` on hosted deployments.

## Data and trust boundaries

1. Components call server APIs for private operations; the browser never receives password hashes, private file paths, or service keys.
2. Each admin API checks the live session and required permission. Hiding an interface control is not authorization.
3. Feedback identity comes from the verified Supabase session and server-loaded profile. Client-supplied `user_id`, email, and name are not trusted.
4. Static content and uploaded documents are separate sources. Public document APIs should expose only published/public metadata and accessible files.
5. Branch contacts carry provenance; unconfirmed addresses and coordinates are not routed or marked on a map.

## Persistence and hosting

Local JSON writes use atomic replacement and backups. The app still requires one local writer and persistent disk. Vercel’s ephemeral filesystem does not meet that requirement. A production content migration needs an approved database and private object storage, a reconciliation of existing migration history, access/RLS policies, backup/restore tests, and real integration tests.

The Supabase project already has `public.profiles`, a role enum, `private.has_permission(text)`, and audit rows. The app’s employee login and assignment are not integrated with that role source. The repository does not contain the remote initial migration `20261110051224_altai_archive_initial_schema`, so do not reset the existing database or assume a fresh local migration chain is complete.

See [DATA_MODEL.md](DATA_MODEL.md), [SECURITY.md](SECURITY.md), and [DEPLOYMENT.md](DEPLOYMENT.md).
