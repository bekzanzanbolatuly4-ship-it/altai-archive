# Architecture proposal

This is a provisional shape for discussion, not a selected stack or deployed design. Keep boundaries modular until the official specification, existing archive systems, database, and operational constraints are known.

## Proposed logical components

1. **Public experience:** accessible, localized catalog/search, record pages, and permitted digitized-document presentation.
2. **Application/API boundary:** validates input, applies authorization and publication rules, and exposes stable application-level contracts.
3. **Domain modules:** catalog and description, access policy, digitized assets, identity/research tools, editorial content, and administration. Add modules only when scope is approved.
4. **Persistence adapters:** isolate archive-system/database access behind interfaces. Preserve original identifiers, hierarchy, source values, and provenance; avoid making a new schema the sole authoritative source without approval.
5. **Search index:** derived and rebuildable from approved sources, with language-aware analyzers selected from actual data. Search results must respect the same access rules as record views.
6. **Asset delivery:** use an approved storage and delivery path with access checks, format validation, and appropriate caching; do not assume public object storage.
7. **Optional AI boundary:** separate service that can receive only explicitly approved, access-filtered content. It must not become an alternate route around catalog permissions.

## Design constraints

- Prefer a modular monolith initially unless scale, team structure, or operational requirements justify separate services.
- Use documented API and domain contracts; avoid coupling UI components directly to a vendor database schema.
- Keep search indexes, embeddings, OCR output, and generated summaries derived and traceable to source versions.
- Record provenance and version information wherever content is transformed or enriched.
- Keep public, staff, and restricted operations behind explicit authorization boundaries.
- Make import and indexing idempotent where possible; support reconciliation and rollback before production data migration.
- Plan observability and audit logging without placing sensitive record content or credentials in logs.

## Stack selection gates

Do not select a framework, database, cloud, identity provider, search engine, OCR tool, or AI vendor until these are known: existing archive platforms and export formats; deployment and data residency rules; staff skills and support model; traffic and collection scale; language/search quality needs; security classification and access policy; procurement constraints; and integration permissions.

## Deployment environments (proposal)

When implementation is authorized, define local, test/staging, and production environments with isolated credentials and data. Use synthetic or explicitly approved sample records outside production. Establish backup, restore, monitoring, patching, incident response, and content rollback responsibilities before launch.

## Decisions intentionally deferred

No runtime, framework, database, search service, CMS, cloud, identity system, AI provider, or deployment target has been selected or verified in this workspace.
