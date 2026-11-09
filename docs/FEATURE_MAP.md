# Feature map

All entries below are **proposed capabilities**, not confirmed official requirements. No capability is implemented.

## Discovery foundation

| Capability | Candidate user value | Key dependencies / questions |
|---|---|---|
| Archive catalog | Browse fonds, series, files, and items where the archive's hierarchy supports them | Official schema, identifiers, description standard, access and publication rules |
| Advanced search | Filter by dates, creator, place, subject, collection, and access state | Searchable fields, date/place vocabularies, spelling and script variants, indexing strategy |
| Digital document viewer and OCR | Inspect permitted digitized material and any available machine-readable text | Image formats, rights, redaction, OCR language/quality, storage and delivery rules |
| Citations and provenance | Reuse stable references to archival descriptions and images | Citation convention, persistent identifiers, versioning and permalink policy |

## Interpretation and context

| Capability | Candidate user value | Key dependencies / questions |
|---|---|---|
| Semantic search | Find records by meaning as well as exact terms | Approved data, evaluation set, language coverage, hosting and privacy review |
| AI Archive Assistant | Ask questions grounded in accessible records | Source-grounding design, access enforcement, disclosure, evaluation, retention, human escalation |
| Summaries, explanations, translation | Understand difficult language or context | Source text quality, domain review, uncertainty handling, rights and language quality |
| Historical atlas and timeline | Explore place and time relationships | Geospatial/time data, historical name authority, uncertainty and source citations |
| Historical place names | Search across changing names and spellings | Curated authority data, variants, time ranges, transliteration policy |

## Engagement and research

| Capability | Candidate user value | Key dependencies / questions |
|---|---|---|
| Digital exhibitions | Curated thematic storytelling | Editorial governance, image rights, staff workflow |
| Community archive | Accept community-submitted items or context | Consent, ownership/licensing, moderation, preservation, withdrawal policy |
| Genealogy and research workspace | Organize personal research and relationships | Sensitive personal data, living-person safeguards, account and retention design |
| Accounts, collections, saved documents | Return to selected material | Identity provider, data residency, retention, export and deletion rules |
| Archivist dashboard | Manage descriptions, access, and publication | Role model, audit, integration with existing systems, approval workflow |

## Cross-cutting requirements to validate

- Kazakh and Russian interface/content support, including search and transliteration behavior.
- Accessibility target, keyboard and screen reader behavior, responsive layouts, and readable document alternatives.
- Privacy, security, data retention, access control, auditability, and records-management requirements.
- Performance expectations for catalog search and large document delivery.
- Editorial ownership and clear distinction between source, staff-authored context, and machine-generated content.

## Suggested sequencing (proposal)

Validate catalog, access policy, and research journeys first. Then build a small discovery and record-detail slice against approved sample data. Add digitized viewing only after rights and delivery constraints are clear. Consider semantic search and generative assistance only after baseline search, source metadata, privacy review, and evaluation criteria are in place. Accounts, contributions, genealogy, and staff administration need separate policy and operational design.
