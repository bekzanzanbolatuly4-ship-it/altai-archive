# ALTAI ARCHIVE development and migration plan

## Current MVP status

Implemented: responsive public pages; RU/KZ/EN interface locale state; client-side catalogue search, filters, year range, relevance/date sorting, and pagination; public document detail/view/download; server-side upload validation; staff login/logout and role checks; document create/edit/delete; sequential publication workflow; JSON persistence/backup; public metadata/file filtering; sitemap; audit events for login, document create/update/delete, staff create/update, and export. Static exhibitions/news/branches/atlas and the assistant content are local demonstration/source-annotated data. This is a local MVP, not a production archival platform.

Not implemented: Supabase, shared database, private object storage, immutable document-version history, user favorites or accounts, dynamic CMS for exhibitions/news/branches, production-grade distributed rate limiting, large-scale search, OCR ingestion, monitored backup jobs, or demonstrated restore operations on production-sized data.

## Before using real archive records

1. Obtain archive-owner approval, a data dictionary, source-ID and hierarchy definitions, rights/access decisions, language conventions, and an approved sample export.
2. Confirm single-instance persistence and storage requirements, hosting/data region, operational owner, availability target, retention, incident response, backup cadence, and restore objectives.
3. Review staff role assignments and dual-control expectations for review/approval/publication. Confirm whether current roles are appropriate for real records.
4. Verify metadata and access policies with archive staff. Test public and restricted examples, including actual file formats, before importing any holdings.

## Supabase preparation (no service connected)

1. Approve the target schema in `DATA_MODEL.md` and record decisions about Auth, row ownership, publication, versions, audit retention, and Storage visibility.
2. Create a dedicated test project/environment only after approval; keep credentials separate and server-only. Write versioned migrations for tables, constraints, indexes, RLS policies, and Storage policies.
3. Test each role and anonymous access against both direct database/API queries and application route handlers. Test disabled accounts, session revocation, every allowed workflow edge, forbidden skips, and storage access after unpublishing.
4. Build an idempotent dry-run importer with a durable source-to-target ID map. Snapshot JSON and files read-only; validate input, count rows by status/access, calculate SHA-256 for every file, and emit a reconciliation report.
5. Import Auth identities through an approved provisioning/reset flow; do not migrate session cookies. Import metadata preserving source strings, original identifiers, provenance, timestamps, and public IDs where safe. Upload files to private Storage and verify counts, lengths, and checksums before linking.
6. Reconcile all entities, relationships, files, language coverage, public responses, and sample staff operations. Require archive-owner sign-off.
7. Cut over after a write freeze and final delta import. Preserve the frozen JSON/files and tested database backup for an agreed rollback window. Roll back by routing back to the frozen instance and separately reconciling any writes made after cutover.

## Production release gates

- Archive owner approval of content, rights/access, languages, staff roles, and public presentation.
- Hosting and data-residency approval; persistent and encrypted storage; secrets isolation and rotation.
- Successful backup/restore rehearsal, file checksum reconciliation, monitoring and alert ownership.
- Security review of API authorization, sessions, uploads, Storage/RLS, rate limiting, and error handling.
- Accessibility and cross-browser/device review; localized form and error review in RU/KZ/EN.
- Operational runbook, incident response, update cadence, content correction/takedown, and named support owners.
- Production build and automated checks passing against the release commit. Do not infer legal or standards compliance from this list.
