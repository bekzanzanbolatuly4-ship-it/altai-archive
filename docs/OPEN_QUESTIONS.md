# ALTAI ARCHIVE open decisions

These decisions remain unresolved in the repository. Do not treat the future PostgreSQL model as approved or use this document as authorization to process real holdings.

## Archive ownership and content policy

1. Who owns the product and who approves requirements, metadata corrections, publication, rights/access decisions, takedowns, and role assignment?
2. What authoritative source systems, identifiers, hierarchy levels, metadata standards, retention rules, and data dictionary apply?
3. Which collections and files may be described, digitized, displayed, indexed, exported, or retained? Who verifies provenance and access status?
4. What rules cover personal/sensitive records, living persons, legal restrictions, correction history, deletion, and preservation?
5. Which current source-annotated branch/contact facts are still valid, and who is authorized to verify updates?

## Identity and workflow

6. Should Supabase Auth be the identity provider, and which invitation, password reset, MFA, session expiry, and account recovery flows are required?
7. Is the existing role matrix approved for real operations? Should authoring, review, approval, and publication be separated among different people?
8. What are the audit retention, export, review, and tamper-resistance requirements?
9. Are visitor accounts, favorites, or personal collections in scope? They are not implemented today.

## Hosting and migration

10. Which hosting region, data-residency constraints, network boundaries, availability, traffic, and support targets apply?
11. What PostgreSQL and Storage backup/restore objectives, retention periods, encryption/key rotation, monitoring, and incident response ownership are required?
12. What source export and file transfer are approved? Who validates row counts, source-to-target ID mapping, file hashes, and migration sign-off?
13. What rollback window is required, and how will post-cutover writes be reconciled if the frozen JSON system is restored?
14. What search volume, language analyzers, transliteration, and accessibility acceptance criteria are required?

## Editorial and localization

15. Will exhibitions, news, branches, and homepage collections be managed dynamically, or remain reviewed static content?
16. Which RU/KZ/EN translations are required at launch, who owns each translation, and which language is authoritative for archival source text?
17. Are OCR, translation, AI assistance, or analytics approved? If so, which data classes, providers, retention, human review, and user disclosure rules apply?

## Current confirmed project facts

- Product name: ALTAI ARCHIVE.
- Tagline: “History preserved for the future.”
- The current repository includes a functional local MVP and demonstration/source-annotated data.
- No Supabase project or external persistence service is connected.
- Legal, regulatory, and standards compliance has not been established by this repository review.
