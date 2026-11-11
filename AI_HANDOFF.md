# AI assistant handoff

## What is implemented

- `POST /api/assistant` validates request origin, JSON size and content type, then applies the existing in-process and Upstash limits.
- Retrieval is limited to published records with public access. Search uses title and description metadata only; original files, staff records and private fields are never sent to an AI provider.
- Responses must be bounded JSON. Citations must name a retrieved opaque source ID and quote an exact excerpt. The route rechecks current publication/access state before returning citations.
- If no public document matches, the route returns a deterministic “no matching published archive material” response without contacting a provider.
- Provider keys stay server-side. Logs contain only provider name, HTTP status and a sanitized provider error code.
- The explicit local demo assistant is separate from provider-generated answers. It is not an AI service and is labelled as a demonstration in the interface.

## Provider configuration

Set these server-side environment variables in Vercel (Production and Preview separately):

| Variable | Meaning |
| --- | --- |
| `AI_PROVIDER` | `openrouter` or `gemini`; defaults to `openrouter`. |
| `AI_API_KEY` | Secret API key for the selected provider. Never use a `NEXT_PUBLIC_` prefix. |
| `AI_MODEL` | OpenRouter accepts `openrouter/free` or a model ID ending in `:free`; Gemini is restricted in this implementation to `gemini-2.5-flash-lite`. |

Legacy `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are still accepted when `AI_PROVIDER=openrouter`; migrate them to the variables above and remove the legacy pair afterwards. OpenRouter requests are constrained to zero-price routing and `data_collection: deny`. Do not configure paid model IDs.

### OpenRouter

OpenRouter’s own current free-tier page says free variants have account-level limits (currently 20 requests/minute and 50/day below the qualifying $10 credit-purchase threshold; 1,000/day at or above it); individual providers can impose tighter limits. Therefore `HTTP 429` is an expected upstream availability case. The app returns `provider_limit`, does not retry or cycle through model IDs, and offers retry only as a user action. The `openrouter/free` router may choose a currently available free model. Our separate Redis limiter remains enabled: 5 requests/minute per IP and 20/minute globally.

### Gemini alternative

Google documents an OpenAI-compatible endpoint at `https://generativelanguage.googleapis.com/v1beta/openai/`. For example, where the account currently exposes the free tier, the model ID `gemini-2.5-flash-lite` can be configured as:

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=<server-side Google AI Studio API key>
AI_MODEL=gemini-2.5-flash-lite
```

This is an integration option, not a claim that a live account/key is already configured or that the provider will serve every request. Use an API project with no billing enabled to avoid billable usage: model names alone cannot guarantee a free request once an account has billing attached. Google currently says free-tier content can be used to improve its products, while paid-tier content is not. Because even public archive metadata may have institutional handling rules, the archive owner must approve that data-processing arrangement before enabling Gemini for real records. No paid API is configured by this change.

## Privacy and limits

- The browser sends only the current question and UI locale to the same-origin API. Conversation history stays in browser memory and is not included in later provider requests.
- Question and matching published public title/description metadata are sent to the configured provider. Do not submit personal data, credentials, unpublished or restricted content.
- Prompt instructions treat both the question and metadata as untrusted input. There are no tools, web search, external citations or file contents.
- The validator rejects invalid output and fabricated/mismatched citations. General knowledge must not be represented as archive evidence.
- Provider free quotas change and can return 429, 5xx, invalid data or timeouts. In each case the app shows a localized unavailable message and offers the separately labelled local demo.

## Verification

Automated checks use synthetic documents, synthetic keys and mocked provider responses. They prove request construction, access filtering, response validation, Origin rejection and safe error handling; they do **not** prove a live model is available.

Production smoke-check on 2026-11-11: `POST https://altai-archive.vercel.app/api/assistant` with Origin `https://altai-archive.vercel.app` and `{ "message": "Find photographs", "locale": "en" }` returned HTTP 200 and `mode: "ai"`. The response had no citations and showed the old no-match weakness. At the time, the deployed code wired only OpenRouter, so OpenRouter is inferred as the live provider; provider identity/model headers were not exposed. This proves one successful request at that moment, not dependable free quota, grounding quality, or current state after a future deployment.

For an authorized live check, first configure a real server-side key and an approved free model in a non-production Preview environment. Ask about a known published public record and confirm the response includes its catalogue link and an exact metadata excerpt. Then verify an unmatched question makes no provider call, restricted/draft records are never returned, cross-origin POST gets 403, and a provider HTTP 429 is displayed as a limit message. Never paste keys into shell history, test fixtures or logs. Remove or rotate temporary credentials after verification.

## Primary provider references

- [OpenRouter free models and free-tier limits](https://openrouter.ai/collections/free-models/)
- [OpenRouter API reference](https://openrouter.ai/docs/api-reference/overview)
- [Google Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [Google Gemini API pricing and free-tier data terms](https://ai.google.dev/gemini-api/docs/pricing)
