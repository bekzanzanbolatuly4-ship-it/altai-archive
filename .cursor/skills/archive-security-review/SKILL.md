---
name: archive-security-review
description: Review ALTAI ARCHIVE security, roles, uploads and document publication.
---
# Archive security review

Inspect the existing implementation before making recommendations.

1. Review lib/archive-auth.ts and server-side authorization.
2. Check requireUser and can usage.
3. Check role boundaries and SUPERADMIN-only account management.
4. Inspect upload validation and private file storage.
5. Verify unpublished and restricted documents are not publicly accessible.
6. Review API routes for authorization and input validation.
7. Check session handling, secrets and error responses.
8. Inspect dependency audit results.

Never print secret values.
Never weaken authorization to make a test pass.
Never expose private uploads.
Do not change security-sensitive code without explaining the impact.
Report findings with file paths and severity.
