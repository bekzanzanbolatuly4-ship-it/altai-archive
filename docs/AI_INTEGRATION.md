# Archive assistant integration

The assistant uses only Google Gemini API directly. The provider is server-side and fixed to `gemini-3.1-flash-lite`; OpenRouter is not used by the application. There is no SDK dependency. The implementation calls Google's `generateContent` REST endpoint.

## Request and safety flow

`components/ai-assistant.tsx` → same-origin `POST /api/assistant` → request validation, Origin check, shared rate limit → controlled retrieval → Gemini → JSON/citation validation → UI.

- The browser sends the current question and at most four prior turns; the server bounds and redacts history. Personal identifiers and credential-like strings are removed before model context.
- Document retrieval includes only current published records with public access and `provenance: verified`; original files, restricted/draft records, admin data and local file paths are excluded.
- Archive-supplied calendars and historical excerpts can be retrieved by simple lexical matching. They are attributed as archive-supplied; source review flags are preserved. This does not independently verify historical claims.
- The model cannot browse, call tools, access files or modify archive data. It receives only the question, bounded dialogue context and relevant source excerpts.
- The API requires JSON output. The server validates exact source excerpts and constructs links to existing site routes. Invalid or stale output is rejected.
- Gemini requests have a 20-second timeout and at most one retry for transient network/429/5xx errors. `Retry-After` is respected; 400/401/403 are not retried. Responses and logs never include the API key or full upstream error bodies.
- Local reference/search results are labelled as non-AI. Provider failures never become a fabricated “AI answer”. If no useful local result exists, the assistant says it could not find a match.
- Production requests require configured Upstash Redis and trusted client-IP data; otherwise the endpoint fails closed.

## Configuration

Set `GEMINI_API_KEY` as a server-only environment variable. Never prefix it with `NEXT_PUBLIC_`, commit it, or send it through chat. For local work, add it to ignored `.env.local`; for Vercel, add it in Project → Settings → Environment Variables for Preview/Production and redeploy after approval.

The example file contains only a blank placeholder. Model is fixed in code as `gemini-3.1-flash-lite` to prevent arbitrary or paid model selection. Google's official model list accepted this model for the configured key on 2026-11-12. Google describes a free tier for this model, but exact project quota/billing status must be checked in AI Studio. Google states free-tier content may be used to improve Google products; the interface discloses this and warns users not to submit personal or confidential information.

## Feedback moderation

Feedback submissions are classified with the same Gemini model on the server. The classifier receives only bounded feedback text after email/phone/token redaction; the original message is preserved unchanged. It stores one category, a short summary and reason, plus `classified` or `needs_review` status. Provider errors, missing keys, malformed output and uncertain cases become `needs_review`; feedback is never deleted or published automatically.

The additive fields are in the local visitor-identity migration. The connected production database was inspected read-only on 2026-11-12 and does not yet have these fields or `visitor_profiles`; the migration is not applied and visitor Auth is disabled by feature flags. Production feedback and moderation are therefore not active yet. After the owner reviews/applies the migration and configures Auth/Upstash, the metadata remains private in `public.feedback_messages` and can be inspected in Supabase Dashboard by an authorized project member. There is no in-app feedback review queue.

## Verification status (2026-11-12)

- Real Google model-list request: HTTP 200; returned `gemini-3.1-flash-lite` as supporting `generateContent`. The API key value was not printed.
- A direct live RU request to Gemini returned an answer citing the archive-supplied 1940 history excerpt. A separate full assistant-path request later received Gemini HTTP 503 and correctly fell back to labelled local search. This means live provider connectivity is proven, but availability is intermittent; the full assistant-path RU/KZ result must be reported according to the final live checks, not inferred from mocks.
- Current API route, UI and error behavior are also covered by mocked unit/E2E tests; these are not Production tests.
- Production Vercel key/deployment and exact project quota are not verified. No deploy was performed.

See [AI_HANDOFF.md](../AI_HANDOFF.md) for the current operator checklist and [OFFICIAL_MATERIALS.md](OFFICIAL_MATERIALS.md) for archive content provenance.
