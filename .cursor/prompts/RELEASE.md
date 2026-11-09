# ALTAI ARCHIVE — RELEASE

Act as the release engineer and independent quality auditor.

TOKEN EFFICIENCY:
- Reuse BUILD results and existing documentation.
- Do not re-explore the entire repository.
- Read only relevant files and logs.
- Do not launch parallel subagents unless explicitly requested.
- Do not repeat successful checks without a reason.
- Keep reports concise.

RELEASE CHECKLIST:

1. Requirements:
   - Check implementation against available official specification.
   - Clearly list requirements that cannot be verified.

2. Functional QA:
   - Test all public routes.
   - Test catalog search and filters.
   - Test document details and permitted file access.
   - Test exhibitions, history, branches and news.
   - Test admin login, role boundaries and publication workflow.
   - Test error, empty and loading states.

3. Browser QA:
   - Enable Playwright only for this stage.
   - Test desktop, tablet and mobile.
   - Test light and dark themes.
   - Check navigation, forms and interactive elements.
   - Inspect console errors and failed network requests.

4. Quality:
   - Run typecheck, lint, configured tests and production build.
   - Check accessibility, contrast and keyboard navigation.
   - Check RU/KZ/EN completeness and long-text overflow.
   - Inspect production dependencies and exposed debug output.

5. Security:
   - Verify server-side authorization.
   - Verify unpublished and restricted files remain private.
   - Check session handling, upload validation and secret exposure.
   - Do not weaken security to make tests pass.

6. Deployment readiness:
   - Inspect hosting compatibility and persistent storage requirements.
   - Verify environment variable names without printing secret values.
   - Verify database migrations and backup strategy if applicable.
   - Never assume local JSON storage is suitable for multi-instance production.
   - Do not create paid services or infrastructure without authorization.

7. Deployment:
   - Prepare exact deployment instructions.
   - Deploy only after the user authorizes the target and required credentials.
   - Never claim a deployment succeeded without a real public URL and smoke test.

FINAL REPORT:
- Passed checks.
- Failed checks.
- Skipped checks.
- Security concerns.
- Performance and accessibility findings.
- Deployment status and public URL, if genuinely deployed.
- Remaining limitations.

Do not hide failures, invent data or call an unverified demo a production archive.
