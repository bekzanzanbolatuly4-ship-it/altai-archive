---
name: nextjs-debugging
description: Diagnose ALTAI ARCHIVE Next.js 16 and React 19 problems.
---
# Next.js debugging

1. Reproduce and identify the actual error.
2. Inspect the relevant route, component and related libraries.
3. Read installed documentation in node_modules/next/dist/docs/.
4. Check server/client component boundaries.
5. Check logs and the smallest relevant code path.
6. Identify the root cause before editing.
7. Make the smallest justified change.
8. Run typecheck, lint and build where appropriate.
9. Report the cause, changed files and verification results.

Do not upgrade dependencies or rewrite architecture without justification.
