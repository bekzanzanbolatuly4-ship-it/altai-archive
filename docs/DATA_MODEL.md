# Conceptual data model

This is a discovery aid, not an approved schema. Actual archive hierarchy, standards, identifiers, field meanings, authority files, retention, and access rules must come from the archive's data dictionary and staff. Do not map or import real material until authorized.

## Candidate concepts

| Concept | Possible fields / relationships | Notes to validate |
|---|---|---|
| Archival unit | Stable source identifier, level/type, title, dates, creator, description, parent unit | Which levels exist and how parent-child hierarchy is represented? |
| Agent / creator | Name, role, dates, identifiers, name variants | Authority control, language/script variants, privacy for living people |
| Place | Name, variants, coordinates if approved, temporal validity, source | Historical geography and uncertainty need provenance |
| Subject / term | Preferred label, variants, language, authority source | Existing thesauri and local terminology |
| Digital asset | Asset identifier, parent unit, media type, checksum, storage reference, rights/access state | Asset policy, rendition/redaction, retention, public delivery |
| OCR/transcription | Asset/page reference, text, language, engine/version, confidence, review state | Treat as derived, potentially incorrect text; keep original image authoritative |
| Access decision | Resource, rule/policy reference, effective dates, decision source | Policy ownership and whether access is item or component-level |
| Enrichment | Source entity/version, type, value, method, creator, timestamp, review status | Separate staff editorial content and machine-generated content |
| Citation | Target identifier, display format, version or retrieval context | Citation rules and permanence requirements |
| User collection (optional) | User reference, saved resource, note, timestamps | Requires approved account, privacy, retention, and export policy |

## Modeling principles

- Preserve original source identifiers, values, and hierarchy; store normalized/search values as derived representations.
- Keep multilingual labels and language/script metadata explicit rather than flattening translations into one field.
- Represent uncertain dates, places, attributions, and OCR confidence without silently converting them into precise facts.
- Store provenance for imported or derived values: source system, source identifier/version, transformation, timestamp, and review state as appropriate.
- Keep access decisions separate from descriptive text and evaluate them consistently across API, search, viewer, exports, and AI retrieval.
- Avoid storing personal research data until its purpose, retention, access, deletion, and export rules are approved.

## Before schema design

Obtain a permitted sample export, data dictionary, hierarchy and identifier rules, metadata standards, multilingual conventions, access/rights fields, digital asset inventory, known data quality issues, and written authority to process the data. Profile representative samples with archive staff; do not infer production schema from the proposed concepts above.
