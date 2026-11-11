# ALTAI ARCHIVE AI integration

This document summarizes the current implementation. [`AI_HANDOFF.md`](../AI_HANDOFF.md) is the authoritative setup, privacy and verification reference; historical task snapshots are retained in [`AI_IMPLEMENTATION_HANDOFF.md`](AI_IMPLEMENTATION_HANDOFF.md) and [`DEPLOY_HANDOFF.md`](DEPLOY_HANDOFF.md).

## Request flow and access

`components/ai-assistant.tsx` → same-origin `POST /api/assistant` → origin and shared rate checks → public metadata retrieval → configured provider → response and citation validation → UI.

- Retrieval reads published records with public access and searches title/description only. Original files, private fields, staff records, and storage paths are not sent to a provider.
- The provider receives the question, locale, and at most five matching public metadata entries. The model has no tools, web search, filesystem, SQL, admin, or archive write access.
- Citations must reference retrieved request-local IDs and exact metadata excerpts; the server builds links and rechecks access before returning them. Exact quotes prove source matching, not that every generated sentence follows from the source.
- With no matches, the API returns a localized deterministic no-match response without a provider call. Provider errors and HTTP 429 remain unavailable errors; the UI may open the separately labelled local demo.
- Origin/Fetch Metadata checks and Upstash Redis production rate limiting remain enabled. In production the AI route fails closed if required Redis configuration or trusted Vercel client-IP metadata is missing.

## Configuration

Set secrets only in the server environment (for example Vercel Project → Settings → Environment Variables). Never add them to Git or `NEXT_PUBLIC_*` variables.

```dotenv
AI_PROVIDER=openrouter
AI_API_KEY=<server-side key>
AI_MODEL=openrouter/free
```

`AI_PROVIDER` supports `openrouter` and `gemini`. OpenRouter also accepts the migration aliases `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` when the selected provider is OpenRouter and the corresponding `AI_*` value is unset. The explicit `AI_*` values take precedence. Unsupported provider names fail closed.

### OpenRouter

Allowed models are `openrouter/free` and model IDs ending in `:free`. The request applies zero `max_price` and `data_collection: deny`; provider routing fallback is enabled only within that zero-price constraint. There is no application retry loop or repeated model-name switching. `openrouter/free` may select different currently available free models. HTTP 429 is an expected outcome and is returned as a sanitized limit error.

OpenRouter currently documents a cap of 20 free requests per minute and 50 per day for accounts without the qualifying credit purchase; individual upstream providers may impose lower limits. These are upstream limits, not an availability guarantee. See [OpenRouter free models and limits](https://openrouter.ai/collections/free-models/).

### Gemini option

The adapter uses Google’s [OpenAI-compatible Gemini endpoint](https://ai.google.dev/gemini-api/docs/openai) and, in this implementation, accepts only `gemini-2.5-flash-lite`:

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=<server-side Google AI Studio key>
AI_MODEL=gemini-2.5-flash-lite
```

Google currently lists free input/output pricing for this model’s Free Tier, but also states that unpaid-tier submitted content may be used to improve Google products. A free quota does not guarantee availability, prevent future policy changes, or ensure that an account has no billing enabled. The adapter cannot enforce an account’s billing state. Do not enable Gemini for archive metadata until the archive owner approves the provider’s data terms and confirms the Google project cannot incur unauthorized charges. No paid API is configured by the repository.

## Data, errors, and limits

- User text and matching public metadata are untrusted input. The prompt prohibits unsupported facts, fabricated identifiers, and invented sources; validation enforces source membership and exact excerpts.
- Common email, phone-like, national identifier, and credential patterns are redacted, but pattern matching cannot identify every personal or confidential detail. Public metadata requires editorial review before external processing.
- Request bodies, provider context, response bodies, output tokens, concurrency, and timeout are bounded. Upstash enforces shared production limits; the process limiter also remains active.
- API keys are server-only. Logs contain provider name, status and a sanitized provider error code, not prompts, credentials or upstream error bodies. Responses are `no-store`.
- The browser’s local demo uses demonstration data and is never presented as an AI-provider answer.

## Verification

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e:ai` exercise mocks/synthetic data. They validate request construction, error handling, access filtering, same-origin enforcement, free-model restrictions and UI behavior. They do not prove that an external provider is currently reachable or that a particular account has free quota.

One Production request was previously observed returning HTTP 200 and `mode: ai`; the provider was inferred to be OpenRouter from that deployed version. It had no citations and is only a point-in-time availability check. There is no current live test of OpenRouter or Gemini from this audit. Do not describe either as reliably available based on mocks or that earlier request.

For current environment variables, owner actions and test instructions, see [`AI_HANDOFF.md`](../AI_HANDOFF.md). For the current status of archive content and source permissions, see [`OFFICIAL_MATERIALS.md`](OFFICIAL_MATERIALS.md).
