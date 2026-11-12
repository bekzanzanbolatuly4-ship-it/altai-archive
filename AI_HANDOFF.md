# Archive assistant handoff

## Current implementation

- The public assistant uses Google Gemini API directly through `POST /api/assistant`.
- Fixed stable model: `gemini-3.1-flash-lite`; official model-list API confirmed it is available to the configured Google key on 2026-11-12.
- Only server variable: `GEMINI_API_KEY`. There is no OpenRouter provider path in the active code. The key is not in `.env.example` except as an empty variable name, and `.env.local` is Git-ignored.
- The assistant supports RU/KK/EN prompts, bounded in-memory conversation context, public verified document metadata, and lexical retrieval from archive-supplied history/calendars. It returns exact quotations and application-built links.
- Direct local reference mode is explicitly labelled non-AI. Provider outage falls back only to locally retrieved/source-linked content; it does not pretend to be generated.
- Output is bounded JSON; input, context, timeout, rate limit and citation checks are enforced. One bounded retry is allowed for transient errors and respects `Retry-After`.
- No streaming. AI moderation is not enabled: the live feedback table does not have moderation result fields, and no migration was applied.

## Local setup

1. Obtain a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Add `GEMINI_API_KEY=...` to the local ignored `.env.local`; do not paste it into chat, source code, tests or logs.
3. Start with `npm run dev` and ask a question supported by a cited source.
4. Check `mode: ai` and source citations for a model response. If the provider is unavailable, `mode: local-search` is not an AI answer.

The Google free tier for `gemini-3.1-flash-lite` lists free input/output pricing, but the account's effective quota and billing status are only visible in AI Studio. Google says content submitted on the free tier may be used to improve its products. Do not send personal, restricted or otherwise confidential information.

## Vercel setup

In Vercel Project → Settings → Environment Variables, add server-only `GEMINI_API_KEY` for the intended environment(s). Keep `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` set to the matching HTTPS site origin. AI also requires the existing Upstash Redis production limiter configuration; without it the API fails closed. Save the variables, then redeploy only after the owner authorizes it. Verify a live RU and KK request and the API's cited source on the deployed version.

## Verified and unverified

- Verified: Google model-list API accepted the configured key and listed `gemini-3.1-flash-lite` with `generateContent`; a direct live RU request produced a cited response from archive-supplied history.
- Intermittent: one subsequent end-to-end local assistant request got Gemini HTTP 503 and returned the explicitly labelled local-search fallback. Real RU/KZ generation through the final server path must be marked according to the final request checks; mocks do not substitute.
- Not verified: Vercel Production key, current Production deployment, the project's exact AI Studio quota/billing tier, real Production assistant, Production feedback/auth storage.
- Feedback AI moderation and its database persistence are not implemented or enabled. A reviewed additive Supabase migration would be required; none was applied.

See [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) for request security and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment configuration. The current local changes have not been deployed.
