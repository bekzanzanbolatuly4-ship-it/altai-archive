# ALTAI ARCHIVE — BUILD

Act as the primary senior engineer responsible for completing this project.

GOAL:
Deliver a polished, functional, maintainable hackathon-ready ALTAI ARCHIVE product.

TOKEN EFFICIENCY:
- Reuse existing project knowledge.
- Inspect only relevant files.
- Do not scan node_modules, .next or .data.
- Do not dump entire files or long logs.
- Do not launch subagents automatically.
- Do not call MCP tools unless needed.
- Avoid repeating completed checks.
- Keep progress reports short.

FIRST:
1. Check Git status.
2. Inspect current documentation and implementation.
3. Read the official archive specification if it exists.
4. If the specification is missing, do not invent its requirements.
5. Identify the highest-impact incomplete features and blockers.

PRODUCT CONSTRAINTS:
- ALTAI ARCHIVE is an informational archival platform.
- No payments, official service applications or document-ordering.
- Preserve the official institution name.
- Never invent branches, contacts, archival facts or coordinates.
- Distinguish synthetic demo data from verified records.
- Preserve Editorial Heritage × Swiss Design × Altai Identity.
- Preserve the current hero and visual direction.
- Complete RU/KZ/EN localization.
- Support light and dark themes.

ENGINEERING:
- Preserve Next.js 16, React 19 and TypeScript conventions.
- Read installed Next.js documentation only when framework-specific work requires it.
- Preserve server-side authorization and the existing role matrix.
- Protect unpublished documents, private uploads and secrets.
- Do not replace working systems without a demonstrated need.
- Do not introduce dependencies without justification.
- Do not migrate databases or change hosting without explicit authorization.

CODE QUALITY:
- No unnecessary comments, AI notes or TODO/FIXME markers.
- No debug statements, unused code or commented-out implementations.
- No duplicate components or needless abstractions.
- Preserve meaningful security and legal comments.
- Do not perform unrelated mass cleanup.

IMPLEMENTATION:
Work in focused stages. Prioritize actual functionality, data integrity,
accessibility, consistent visual quality and responsive behavior.
Fix discovered defects rather than hiding them.
Create or update tests for critical workflows.

VERIFICATION:
Run relevant typecheck, lint, tests and production build.
Do not claim a check passed unless it actually passed.
Do not claim a feature works if it has not been verified.

At completion, report:
- Implemented features.
- Files changed.
- Checks passed and failed.
- Remaining blockers.
- Any decisions requiring user authorization.

Do not deploy or publish anything during this stage.
