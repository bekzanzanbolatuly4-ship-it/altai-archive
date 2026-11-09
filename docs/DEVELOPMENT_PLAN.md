# Development plan

Sequence and exit criteria are proposals. Reorder them with archive stakeholders after the official requirements and data access conditions are known.

## Phase 0 — Discovery and authorization

**Work:** Confirm product owner, decision-makers, intended audiences, official requirements, scope, operational constraints, rights/access policy, and what data may be inspected.

**Exit:** Approved requirements baseline; named owners; documented data handling and access permissions; prioritized initial journey.

## Phase 1 — Data and system assessment

**Work:** Review permitted schema/sample exports, hierarchy and identifiers, language coverage, data quality, digitized assets, existing systems, integrations, and deployment/security constraints.

**Exit:** Data mapping and gap report reviewed by archive staff; integration and hosting options constrained; no unapproved data copied.

## Phase 2 — Architecture and prototype definition

**Work:** Choose a small user journey; define API/domain boundaries, access model, localization and accessibility criteria, stack and environments; create interface prototypes using synthetic or approved sample content.

**Exit:** Architecture decision record, reviewable prototype, testable acceptance criteria, threat/privacy review, and implementation estimate approved.

## Phase 3 — Discovery MVP (candidate)

**Work:** Implement catalog browsing/search and record detail on a limited approved dataset, with localization, stable citations, access checks, and operational logging.

**Exit:** Stakeholder acceptance; search and access tests pass; accessibility and security review completed; backup/restore and deployment ownership established.

## Phase 4 — Digitized material workflow (candidate)

**Work:** Add authorized asset delivery, viewer, OCR presentation, rights display, and staff correction/publication flow only if supported by policy and source systems.

**Exit:** Rights/access behavior verified for representative cases; asset integrity and rollback procedures demonstrated; OCR clearly distinguished from source.

## Phase 5 — Additional capabilities (separate approvals)

Evaluate atlas/timeline, exhibitions, user accounts, saved collections, community contributions, genealogy tools, administration, semantic search, and AI assistant as independent initiatives with their own discovery, policy, and acceptance criteria.

## Ongoing work

Localization review, accessibility testing, data quality monitoring, security patching, backups, incident response, analytics/privacy governance, staff training, and user feedback.

## Current implementation status

The hackathon implementation brief authorizes a local demonstration MVP. A Next.js application is now implemented with responsive routes, synthetic demonstration content, browser-persisted theme/language/history/admin state, schematic maps, and a local catalogue-search assistant. This does not establish official archive policy, production authentication, rights/access decisions, real archive integrations, or data import. The referenced official DOCX specification was not present in the repository at implementation time. Validate the outstanding Phase 0 and Phase 1 requirements before using real holdings or deploying as an official archive service.
