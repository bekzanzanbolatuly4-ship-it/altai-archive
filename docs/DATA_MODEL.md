# Archive portal data model

This document distinguishes the local MVP from a proposed PostgreSQL model. The proposed schema is not implemented and must be validated against the archive's data dictionary, retention rules, rights decisions, and hosting requirements before migration.

## Current MVP (implemented)

The server stores `users`, `documents`, `sessions`, and the last 200 `audit` events as JSON in `.data/archive-store.json`, with a JSON backup and upload files in `.data/uploads/`. Documents contain descriptive fields, `status`, `accessStatus`, created/updated timestamps, `createdBy`, and one stored file reference. Document versions are not retained. Staff passwords are scrypt hashes; sessions are signed eight-hour cookies backed by the JSON session list. Password/session records and uploads are not exposed through public DTOs.

Static content in `data/archive.ts` supplies demonstration catalogue records, exhibitions, news, historical places, and archive locations (some source-marked verified, others demonstration). Homepage collections are static navigation cards, not a persisted collection entity. Recently viewed document IDs are kept in browser `localStorage`; favorites and user collections are not implemented.

## Proposed PostgreSQL model (future; not implemented)

Use UUID primary keys for application-owned rows and preserve every source archive identifier in a separate nullable `source_id` plus source-system/provenance fields. Store language and source-language values explicitly. Do not flatten archival hierarchy or infer missing identifiers.

| Table | Candidate columns and relationships | Constraints / indexes |
|---|---|---|
| `profiles` (staff profiles) | `id uuid primary key references auth.users(id)`, display name, role, disabled, created/updated timestamps | Role enum matching current matrix; unique lower-case email remains in Auth; index role/disabled. Provision staff only through trusted server admin operations. |
| `documents` | stable UUID, source identifier, title, description, archival identifiers, dates as source-preserving text until date semantics are approved, language, provenance, status, access status, creator/updater profile IDs, timestamps, current version ID | CHECK status and access enums; FK profiles; indexes on status/access, source ID, and multilingual search fields; unique source ID only if the source guarantees uniqueness. |
| `document_versions` | document FK, monotonically increasing version number, immutable metadata snapshot, author, reason, created timestamp | unique `(document_id, version_number)`; index `(document_id, created_at desc)`. Insert a version in the same transaction as every accepted metadata/workflow update. |
| `document_files` | document FK, optional version FK, bucket/object path, original name, media type, byte size, SHA-256, upload actor/time, file role/rendition | unique bucket/object path; index document/version; never accept client-supplied paths as authority. Store private originals; public delivery checks the related document's current published/public decision. |
| `audit_logs` | actor profile ID (nullable for retired users), actor email snapshot, action, entity type/ID, timestamp, request/correlation ID, redacted metadata | append-only; indexes `(created_at desc)`, `(actor_profile_id, created_at desc)`, `(entity_type, entity_id, created_at desc)`; no secrets or document contents in metadata. |
| `exhibitions` | slug, localized title/intro/content, publication state, source/provenance, creator/updater, timestamps | unique slug; publication index. Future table: current content is static/demo data. |
| `news` | slug, localized title/excerpt/body, publication state/date, provenance, author/timestamps | unique slug; publication/date index. Future table: current content is static/demo data. |
| `branches` | stable ID, official name, affiliation, multilingual labels, contacts/addresses only with source and validity dates, provenance/review state | no invented defaults; unique source ID when available; index affiliation and active/valid period. Future table: current locations are static and source-annotated. |
| `collections` | optional editorial collection title/description, visibility, sort order, owner/creator | not the current static homepage cards; create only after product scope is approved. |
| `collection_documents` | collection FK, document FK, position | unique `(collection_id, document_id)`; indexes both FKs. |
| `favorites` | profile FK, document FK, created timestamp | unique `(profile_id, document_id)`; not implemented and only create if authenticated research accounts are approved. |

### Relationships

- One Auth user has at most one `profiles` row; profile owns staff authorship and role attributes.
- One document has many immutable versions and many files. A file may be linked to the version whose description it represents.
- Documents, versions, files, and audit events reference staff profiles where applicable. Audit rows survive account removal by retaining a redacted actor snapshot rather than cascading away.
- Exhibitions and news remain separate content types. A future explicit join table can link either to documents; do not put arbitrary unvalidated IDs in JSON arrays.
- Collections contain documents through `collection_documents`. Favorites are per-profile and optional.
- Branches are institutional entities; no geographic coordinates unless a reliable source and review state exist.

## Roles, workflow, and RLS (future policy draft)

Keep the application role matrix exactly as implemented: `SUPERADMIN` (all), `SITE_ADMIN` (read/upload/edit/publish/audit), `ARCHIVE_EMPLOYEE` (read/upload/edit), `EDITOR` (read/edit/publish), `BRANCH_ADMIN` (read/upload/edit), `MODERATOR` (read/edit), `ANALYST` (read/audit). Roles must be loaded from a server-controlled `profiles` row, never from user-editable user metadata. No public self-registration.

Use a private schema for staff-only tables where practical. Enable RLS on every exposed table. Public document reads require both `status='published'` and `access_status='public'`; public users must never select drafts or restricted records. Authenticated staff policies still need role predicates: authentication by itself is not authorization. `UPDATE` policies need both a restrictive `USING` and `WITH CHECK`; clients must not alter role, creator, source ID, or workflow authority fields directly. Prefer server route handlers for mutations and enforce the same transition map transactionally. Files in private Storage must have policies based on document status/access and staff role; never expose service-role credentials to the browser. Audit is insert-only for trusted server operations and read-limited to current audit roles. Session lifecycle should be handled by Supabase Auth rather than a second application session table; revoke/refresh rules still need an operational decision.

Workflow edges: `draft → review` (edit); `review → draft` (edit); `review → approved`, `approved → published`, `published → archived` (publish). No skipping or reopening archived rows through an unlisted edge. A publish transition does not make restricted content public; access policy remains an independent check.

| Target table | Anonymous policy | Staff policy |
|---|---|---|
| `documents` | SELECT only when published and public; no writes | SELECT only for an enabled profile with `read`; mutations only through server checks for `edit` / `publish`, with row-state and transition checks in the same transaction. Restrict direct client writes to workflow, source ID, creator, and access fields. |
| `document_versions`, `document_files` | no direct table access; public file delivery uses an application route or tightly scoped Storage policy tied to a published/public document | read through authorized server path; inserts tied to allowed document operations; no client deletion of historical versions. |
| `profiles` | no access | current user's safe profile read; staff list/change only for the existing account-management authority (`SUPERADMIN`). A user cannot self-promote or alter disabled/role fields. |
| `audit_logs` | no access | trusted server inserts only; reads for current audit-capable roles. No update/delete policy for clients. |
| `exhibitions`, `news`, `branches` | SELECT published/verified-approved public rows only | server-managed editorial writes with explicit role and provenance checks. |
| `collections`, `collection_documents`, `favorites` | no policy until product visibility is decided | optional curation/favorites require separately approved ownership and privacy policy; never grant broad authenticated access by default. |

These are policy semantics, not deployable SQL. When RLS is implemented, every exposed table needs RLS enabled. Authenticated status alone is not authorization; update rules need both row visibility (`USING`) and resulting-row validation (`WITH CHECK`). Avoid user-editable Auth metadata for roles and avoid views that bypass the intended RLS behavior.

## Safe migration outline

1. Obtain authorization, data dictionary, source-ID rules, rights/access classifications, account provisioning plan, and approved hosting/storage region. Freeze schema decisions until these are reviewed.
2. Make a read-only snapshot of JSON and uploads. Record counts for each top-level collection, document IDs, file paths, byte sizes, and SHA-256 checksums. Validate JSON against the current schema and report malformed rows without dropping them.
3. Create versioned PostgreSQL migrations and policies in a non-production environment. Test with anonymous, each staff role, disabled users, owner, unpublished and restricted records. Verify transitions and RLS at the database/API boundary.
4. Import profiles through an approved Auth provisioning flow; do not copy active session cookies or expose password hashes. Import document IDs and source IDs deterministically, preserving original text/provenance. Keep a source-to-target ID map.
5. Upload files to private Storage using deterministic object keys; compare count, byte length, and SHA-256 after transfer. Link files to document rows only after checksums match. Keep the original JSON and files read-only during reconciliation.
6. Compare row counts by entity/status/access, orphan references, file counts/checksums, public API result sets, and representative multilingual records. Obtain archive staff sign-off.
7. Cut over with a short write freeze and final delta import. Keep JSON snapshot and file tree untouched for a defined rollback window. Rollback means route traffic back to the frozen local version and reconcile any post-cutover writes; do not silently dual-write without an idempotency plan.
8. Define retention/deletion for snapshots, credentials, backups, and migration logs before removing any source copy.

### Supabase Storage layout (future proposal)

Use private buckets only: `archive-originals` for uploaded source files and `archive-derivatives` for reviewed renditions/OCR sidecars. Key objects by stable document and version UUIDs (`documents/{document_id}/versions/{version_id}/{file_id}`), never by a client-provided path. Record bucket, object key, byte size, media type, checksum, and version relationship in `document_files`. Do not make a bucket public: public delivery should pass through an application route that checks the current `published` + `public` state on every request, preventing stale links after access changes. Storage policies should deny anonymous direct object reads and writes; server upload/download routes enforce the role matrix and document access state. Any server key that bypasses RLS stays server-only and must not reach browser bundles.

The import/reconciliation tooling, Supabase migrations, RLS/Storage policies, and bucket setup do not exist yet. Candidate runtime variable names for a later approved integration are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`; these names are a plan, not current configuration. Never use the secret key in browser code.
