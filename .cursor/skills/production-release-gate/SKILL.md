---
name: production-release-gate
description: Use before preparing, approving or deploying an ALTAI ARCHIVE release.
---
# Production Release Gate

1. Verify requirements against the official specification.
2. Run typecheck, lint, configured tests and production build.
3. Test all public routes and critical workflows.
4. Check responsive layouts and RU/KZ/EN completeness.
5. Verify light and dark themes and accessibility.
6. Test authentication, roles, publishing and private file access.
7. Check secrets, dependency risks and exposed debug output.
8. Verify persistence, backups and recovery where applicable.
9. Inspect metadata, SEO, loading and error states.
10. Verify deployment configuration and environment variables.
11. Run smoke tests against the deployed URL.
12. Report passed, failed, skipped and unverified items separately.

Never claim deployment or successful testing without actual evidence.
Never publish without explicit user authorization.
