---
name: database-migration
description: Use only for explicitly authorized database design, data migration or storage changes.
---
# Database Migration

1. Inspect the current data model, persistence layer and existing data.
2. Confirm the target database and storage architecture before implementation.
3. Never initiate a production migration without explicit authorization.
4. Design normalized tables, constraints, indexes and relationships.
5. Plan migrations, rollback and backup procedures.
6. Preserve document identifiers and existing metadata.
7. Separate public records, drafts and restricted records.
8. Enforce server-side authorization and database-level access policies.
9. Test migrations against a disposable development dataset first.
10. Verify record counts, relationships and file integrity after migration.
11. Never expose credentials or private data in logs.
12. Document unresolved risks and recovery procedures.
