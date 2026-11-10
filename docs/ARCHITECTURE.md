# ALTAI ARCHIVE architecture

## Current MVP (implemented)

- Next.js 16 App Router and React 19. Route handlers implement the HTTP boundary; client components implement catalogue controls and the staff workspace.
- `data/archive.ts` contains the demonstration catalogue and static exhibitions, news, atlas points, branches, and homepage collection cards. These arrays are not backed by a CMS/database. The branch entries include source/provenance fields; demonstration records stay labelled as such.
- Uploaded document records, staff accounts, sessions, and a bounded audit log are stored in `.data/archive-store.json`. A previous-state JSON backup is kept beside it; dated backups are created during export. Uploads are local files under `.data/uploads/`. This is single-instance local persistence, not shared or horizontally scalable storage.
- `lib/archive-auth.ts` verifies signed HttpOnly cookies against server-side session rows, checks disabled users, and enforces the existing role matrix through `requireUser` / `can`. Passwords are scrypt hashes. Login throttling is in-process memory.
- Public document handlers return only published/public metadata and files. Staff handlers require permissions and can read private files. The publication workflow is server-enforced. Browser language, theme, and recently viewed IDs are stored in localStorage; there are no visitor accounts, saved favorites, or persistent user collections.
- The catalogue currently merges static demo records with the public document API and filters/sorts/pages in the browser. This is suitable for the MVP-sized dataset, not a large collection or archive-grade search index.
- No Supabase client, database, external auth provider, Storage service, CMS, or external AI service is connected.

## Boundaries to keep

1. **UI:** preserve current visual system; call stable application APIs instead of directly importing storage details into client code.
2. **API/domain:** validate request shape, authorize each operation, apply workflow transitions and access decisions atomically, emit public DTOs rather than stored file paths/password data.
3. **Persistence:** isolate JSON access behind `lib/archive-store.ts` today. When migration is approved, replace this adapter without making UI components depend on Supabase table names.
4. **Files:** private original storage; public delivery must check the current document publication/access decision. Future object storage keys are server-owned opaque values.
5. **Static editorial content:** migrate exhibitions/news/branches only after ownership and update requirements are established. Until then they remain explicitly static/demo/source-annotated.

## Future Supabase target (not connected)

Use PostgreSQL for profiles, documents, immutable document versions, document-file metadata, append-only audit logs, and—if editorial administration is approved—exhibitions, news, and branches. Supabase Auth should own identity and session lifecycle; `profiles` carries server-controlled roles. Postgres RLS must be enabled for every exposed table. Anonymous reads are limited to published/public records. Staff access must use the current role matrix and workflow checks; `authenticated` alone is not sufficient. Keep originals in private Supabase Storage and authorize reads using document state. Never put a service-role key in a client bundle.

Collections in the homepage are currently presentation data, not user-owned entities. A future `collections` / `collection_documents` model is optional editorial curation. `favorites` are not implemented; add only after research-account scope and privacy/retention rules are approved. See [DATA_MODEL.md](DATA_MODEL.md) for candidate columns, relationships, indexes, RLS boundaries, and migration reconciliation.

## Operations and constraints

- Local JSON writes are serialized and use an atomic primary-file replacement. The previous primary is staged as backup before replacement. Recovery must preserve a corrupt primary and raise an explicit error when no valid backup exists; never silently reset the store.
- Local disk requires a persistent volume and one application writer. Serverless/ephemeral deployments are not supported by this implementation.
- Before production, choose hosting/data region, define secrets handling and key rotation, external rate limiting, backup retention, restore drills, monitoring, upload limits, access-rights review, and incident ownership. Do not treat successful compilation as production approval.
- Keep Next.js route and caching behavior aligned with the installed Next.js documentation. Public caching must not serve private document files or stale access decisions.
