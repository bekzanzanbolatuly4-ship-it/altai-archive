# AI assistant handoff

## What is implemented

- `POST /api/assistant` validates request origin, JSON size and content type, then applies the existing in-process and Upstash limits.
- Retrieval is limited to published records with public access and `provenance: verified`. Search uses title and description metadata only; original files, staff records, demonstration records and private fields are never sent to an AI provider.
- Six reference intents (archive-fund definition, catalogue use, branches, official documents, institution overview and site sections) use a separate curated set of approved public site facts and verified links. They can call the configured model even when archive storage is empty; these requests do not read the catalogue. Other questions retain the archive-search path and do not trigger generation without a verified public match.
- Successful reference responses use `mode: ai`, validated citations and a localized UI notice that the text was automatically generated. Provider failure remains a visible unavailable error for reference questions; it is never replaced by fabricated AI or mislabelled local search.
- Responses must be bounded JSON. Citations must name a retrieved opaque source ID and quote an exact excerpt. The route rechecks current publication/access state before returning citations.
- If no public document matches, the route searches a separate synthetic demonstration set and returns it only as `mode: local-search`; this is explicitly not generative AI. With no local match, it returns a deterministic no-match response without contacting a provider.
- Provider keys stay server-side. Logs contain only provider name, HTTP status and a sanitized provider error code.
- If verified public metadata matches but the provider is unconfigured, unavailable, rate limited, or returns invalid output, the API rechecks current publication/access/provenance and returns `mode: local-search` with those metadata source links. The answer explicitly says that no AI response was generated. This is not an AI service. Origin checks and the production limiter remain fail-closed.

## Provider configuration

Set these server-side environment variables in Vercel (Production and Preview separately):

| Variable | Meaning |
| --- | --- |
| `AI_PROVIDER` | `openrouter` or `gemini`; defaults to `openrouter`. |
| `AI_API_KEY` | Secret API key for the selected provider. Never use a `NEXT_PUBLIC_` prefix. |
| `AI_MODEL` | OpenRouter accepts `openrouter/free` or a model ID ending in `:free`; Gemini is restricted in this implementation to `gemini-2.5-flash-lite`. |

Legacy `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are still accepted when `AI_PROVIDER=openrouter`; migrate them to the variables above and remove the legacy pair afterwards. OpenRouter requests are constrained to zero-price routing and `data_collection: deny`. Do not configure paid model IDs.

### OpenRouter

OpenRouter’s own current free-tier page says free variants have account-level limits (currently 20 requests/minute and 50/day below the qualifying $10 credit-purchase threshold; 1,000/day at or above it); individual providers can impose tighter limits. Therefore `HTTP 429` is an expected upstream availability case. The provider layer classifies it as `provider_limit` and does not retry or cycle through model IDs. If verified public metadata matched, the route returns explicitly labelled `local-search` with those source links; otherwise it may show the separately identified static demonstration search. The `openrouter/free` router may choose a currently available free model. Local code configures a Redis limiter at 5 requests/minute per IP and 20/minute globally; the current Production backend could not be confirmed.

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
- Question and matching published public title/description metadata marked `verified` are sent to the configured provider. Do not submit personal data, credentials, unpublished or restricted content.
- Prompt instructions treat both the question and metadata as untrusted input. There are no tools, web search, external citations or file contents.
- The validator rejects invalid output and fabricated/mismatched citations. General knowledge must not be represented as archive evidence.
- Provider free quotas change and can return 429, 5xx, invalid data or timeouts. A matching verified public source is returned in explicitly labelled `local-search` mode without generated prose; without a public match, the static demonstration set remains separately labelled.

## Verification

Automated checks use synthetic documents, synthetic keys and mocked provider responses. They prove request construction, access filtering, response validation, Origin rejection and safe error handling; they do **not** prove a live model is available.

Production audit on 2026-11-11: `GET /api/documents` returned HTTP 200 with an empty documents list. A valid same-origin, deliberately unmatched assistant POST returned HTTP 200 with `mode: no-match` and no citations; a foreign-Origin POST returned HTTP 403. A GET to the POST-only assistant route returned HTTP 405. These observations predate the current reference-question change; Production version, environment variable names/values, active provider/model and Redis state cannot be introspected from the public API. The local published/public record count is zero too.

Local provider configuration was inspected without printing values: `AI_PROVIDER`, `AI_API_KEY` and `AI_MODEL` are absent; legacy `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are present, and the selected legacy model passes the free-model allowlist. A direct real OpenRouter test used only the public question “How do I use the archive catalogue?” and curated public page metadata. OpenRouter returned HTTP 429; no model answer was received. This confirms the legacy aliases reached the provider endpoint, but does not prove successful generation or reveal Production settings. Gemini was not called.

Gemini configuration is supported by the same adapter and route: set `AI_PROVIDER=gemini`, `AI_MODEL=gemini-2.5-flash-lite`, and provide a Google API key through server-only `AI_API_KEY`. The local environment has no `AI_API_KEY`, `GEMINI_API_KEY`, or `GOOGLE_API_KEY`; the only configured provider credential is the legacy OpenRouter key and it must not be reused for Gemini. No Gemini request was sent and no Gemini response is claimed. Do not add a key or enable billing to complete this check. Before sending public archive context to Gemini, obtain the archive owner’s approval for Google’s applicable data terms; also verify the Google project’s billing status and free-tier eligibility in its owner console, because code cannot detect or enforce account billing status.

The local patch routes approved reference questions to the provider even with an empty archive store. This change is not deployed. Until Vercel is updated and a real Production request succeeds, the required public-site AI scenario remains unverified.

Earlier black-box checks saw five unmatched Production requests return HTTP 200 and the sixth HTTP 429, consistent with the 5-per-minute-per-IP rule. The current check did not retest the limiter threshold. Black-box behavior cannot prove which limiter backend/version served that earlier threshold; Redis credentials and state remain unobservable.

The public document API and assistant use read-only metadata access. Vercel's function filesystem is not a persistent archive database; the current Production catalogue remains empty. The legacy archive domain is referenced by official and academic sources, but its pages could not be retrieved directly in this environment. A public article by a State Archive of East Kazakhstan Region archivist cites identifiable holdings, but its host expressly prohibits reproduction without written permission. No record was imported, and no PDF was copied or created. See [the article and cited holdings](https://de-archiv.kz/en/issledovaniya/kratkij-obzor-fondov-gosudarstvennogo-arhiva-vostochno-kazahstanskoj-oblasti-po-istorii-nemcev-v-vostochnom-kazahstane).

The 2014 conference book hosted on the legacy archive domain was issued with the State Archive of East Kazakhstan Region, but excerpts inspected there are attributed to the Central State Archive of Kazakhstan; it does not verify individual VКО holdings and was not used to seed the catalogue. [Official regional archive information](https://www.gov.kz/org/vko-cultura-arhiv/press/events/details/1292) describes the institution and its events, not individual downloadable records. The [regional archive service update](https://www.gov.kz/org/akimvko/press/news/details/1299189?lang=ru) describes E-Archive search and service access, not a public record feed.

No actual archival record has been added. A sourced generative answer requires the archive to provide or approve public record metadata and a durable read-only source for Production. No Production environment, external account, database or provider configuration was changed.

For an authorized live check, first configure a real server-side key and an approved free model in a non-production Preview environment. Ask about a known published public record and confirm the response includes its catalogue link and an exact metadata excerpt. Then verify an unmatched question makes no provider call, restricted/draft records are never returned, cross-origin POST gets 403, and a provider HTTP 429 is displayed as a limit message. Never paste keys into shell history, test fixtures or logs. Remove or rotate temporary credentials after verification.

## Primary provider references

- [OpenRouter free models and free-tier limits](https://openrouter.ai/collections/free-models/)
- [OpenRouter API reference](https://openrouter.ai/docs/api-reference/overview)
- [Google Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [Google Gemini API pricing and free-tier data terms](https://ai.google.dev/gemini-api/docs/pricing)
