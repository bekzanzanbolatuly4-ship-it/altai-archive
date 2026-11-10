# ALTAI AI integration

Implementation status: server endpoint, public retrieval, OpenRouter adapter and assistant UI implemented. Mock unit tests and production compilation pass. Live provider behavior and browser E2E remain unverified in this environment; this is not a production certification.

## Architecture

`components/ai-assistant.tsx` → same-origin `POST /api/assistant` → `lib/ai/agent.ts` → public search → OpenRouter → response/citation validation → UI. The previous local demonstration assistant remains an explicitly labelled, user-selected fallback. Provider failures never return a canned response marked as AI.

Modules:

- `lib/public-access.ts`: shared anonymous access policy for public list/detail/file API, metadata, sitemap and AI. Requires published/public and rejects hidden/deleted records.
- `lib/ai/context.ts`: validates input, detects RU/KK/EN with site-locale fallback, redacts common sensitive patterns, ranks public title/description word matches, selects up to five records and maps IDs to request-local S1…S5.
- `lib/ai/instructions.ts`: versioned system rules (1.0.0); see AI_AGENT_RULES.md.
- `lib/ai/openrouter.ts`: server-only call graph, fixed official API URL, credentials from server environment, one request, AbortController and finite budgets.
- `lib/ai/validation.ts`: strict JSON answer, citation membership, exact metadata excerpt and second access check; links built by server. Revoked/changed context fails closed instead of returning stale prose.
- `lib/ai/limits.ts`, `errors.ts`: bounded streamed reads, process-wide rate/concurrency budget and sanitized errors.

The model has no SQL, shell, filesystem, administrative or archive mutation tools. No auth changes, new dependencies, Supabase integration, migrations or embeddings are involved. JSON storage and public APIs remain the source of truth. Synthetic bundled catalogue entries remain in the local demo only; they are not silently merged into verified retrieval.

## Configuration and running

Set these values locally without committing them:

```dotenv
OPENROUTER_API_KEY=<your-key>
OPENROUTER_MODEL=<exact-Gemma-4-31B-Free-model-id-ending-in-:free>
APP_ORIGIN=http://127.0.0.1:3000
```

The model is never hardcoded. Use the exact available OpenRouter model ID for the requested Gemma free model. Its current availability has not been confirmed with a live request. Only IDs ending in `:free` are accepted; provider maximum prompt/completion prices are also zero. No alternative model or paid fallback is selected. Provider fallback is disabled; `data_collection: deny` is requested. If no eligible provider exists, users see an unavailable state and can open the demo.

### Safe local live check without editing `.env.local`

In a private terminal, read the key without echo, enter an eligible `:free` model ID, and launch the local server in that same shell:

```sh
read -rsp 'OpenRouter key: ' OPENROUTER_API_KEY; printf '\n'
export OPENROUTER_API_KEY
read -rp 'Exact OpenRouter :free model ID: ' OPENROUTER_MODEL
export OPENROUTER_MODEL
export APP_ORIGIN=http://127.0.0.1:3000
npm run dev
```

Open `/assistant` locally and submit a non-sensitive question. The key stays in the server process environment; it is not a `NEXT_PUBLIC_*` variable or part of the browser request. Stop the server and run `unset OPENROUTER_API_KEY OPENROUTER_MODEL APP_ORIGIN` in that shell. Submitting a question makes a real external request, so this check is deliberately manual. The current project’s browser E2E uses a mock provider; live OpenRouter behavior remains **NOT TESTED**.

```sh
npm run dev
# http://127.0.0.1:3000/assistant
npm run build
npm start
```

Production requires `APP_ORIGIN` to match the trusted public origin, as required by the existing request-security policy. Do not overwrite an existing `.env.local`. A real submission with configured credentials makes an external AI request; the implementation work and automatic tests make none.

## Budgets and failures

Request body ≤10,000 bytes, body read ≤10 seconds, question ≤2,000 characters, five metadata records (title ≤180 and description ≤500 characters each). Serialized provider messages ≤14,000 UTF-8 bytes, used as a conservative input-token budget rather than an exact model tokenizer. Output ≤900 tokens; decoded provider response ≤32,000 bytes; validated answer ≤2,500 characters. Provider timeout 20 seconds; browser timeout 25 seconds. No automatic retries. The UI offers explicit retry.

A process admits at most 20 requests/minute and two concurrent requests. When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, `lib/ai/shared-rate-limit.ts` also applies an atomic shared 5 requests/minute per-IP limit and 20/minute aggregate limit; it stores only a SHA-256-derived IP key with a short TTL. In production it requires Vercel's client-IP header and the shared store; missing/failed configuration returns unavailable before OpenRouter. Local development can run without Redis and retains the process limiter. No IP is logged. Do not proxy Vercel through an untrusted proxy that can replace client-IP headers.

Missing credentials/model, provider errors/429, timeout, invalid JSON/schema, unsupported citations or changed access return sanitized unavailable errors. Upstream error bodies, prompts and credentials are not logged. HTTP 429 includes Retry-After. UI messages are available in RU/KK/EN. History is memory-only in the page and is not resubmitted; each question is independent. The demo is clearly separate from model responses.

Provider-side spending controls remain a required operator step. The app permits only free model IDs and provider price limits of zero, but this does not replace provider account limits, alerts or changing provider quotas.

## Retrieval and evidence

Only anonymous published/public records enter retrieval. Private filenames, original PDFs, staff identifiers, sessions and audit records are never included in the provider payload. IDs presented to the model are request-local aliases; URLs are never generated by the model. Each returned source includes a server-approved excerpt and a relative link to the public document page. Unknown source IDs, fabricated quotes and link-bearing model answers fail validation. No matches are shown explicitly as no confirmed archive sources; system instructions prohibit inventing documents.

Citation validation proves access and exact quotation of metadata, **not semantic entailment of every generated sentence**. The UI states that PDFs have not been read, distinguishes demonstration sources and warns that model text may be wrong. A metadata description is not proof of an underlying historical event. Public routes recheck access on subsequent visits.

## Security and data governance

System instructions are defense in depth, not authorization. Retrieval and revalidation enforce the central policy regardless of model behavior. Untrusted metadata remains in the data message, never in system instructions. React renders plain text, with no HTML or Markdown execution. Provider response schemas cannot authorize tools, write operations or arbitrary source URLs.

Only allowlisted public title, description and provenance are transmitted. Common emails, phone-like strings, 12-digit identifiers and explicit token/password patterns are redacted in the question and metadata. Pattern matching cannot recognize all personal data or confidential text (especially names and contextual sensitive information). Public metadata must therefore be reviewed for external processing before live use. Do not submit sensitive questions. User-facing disclosure explains the external transfer. No prompt persistence or analytics were added.

Before a live rollout, archive owners must verify rights, personal-data review, provider retention/training policies, processing regions, subprocessors and incident handling. `data_collection: deny` does not by itself certify legal compliance, residency or zero retention. Free providers have changing quotas and availability; 429 and outages are expected. No fixed daily allowance is promised.

Official references: [Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request), [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), [free models](https://openrouter.ai/collections/free-models).

## Tests and verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
# Optional existing Playwright installation; no dependency is installed automatically:
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright/index.mjs npm run test:e2e:ai
```

`tests/ai-agent.test.mjs` uses mock fetch only: success, no key, paid-model refusal, provider error/429, timeout, malformed/truncated/tool responses, rate/concurrency limits, injection boundaries, restricted/draft/hidden/deleted exclusion, secrets/PII minimization, forged excerpts, revoked/changed sources, no results, languages and input/body limits.

`tests/ai-route.test.mjs` executes the actual route handler with an in-memory synthetic store and mock provider, checking origin validation, request validation, missing configuration, success, citations and sanitized 429 responses.

`tests/e2e/assistant.mjs` copies source to a temporary directory excluding `.env*`, `.data`, `.git`, build files and dependencies; links installed dependencies, creates synthetic data, starts an isolated server and intercepts all OpenRouter requests with `tests/fixtures/ai-provider.mjs`. No real keys or original archive data are used. It exercises the actual endpoint, sources, keyboard interaction, errors/retry/demo and RU/KK/EN at desktop/light and mobile/dark sizes. Screenshots go to `output/playwright/`. Server and temporary data are removed afterward. Requires a local port and Playwright Chromium.

On this implementation run, unit tests, typecheck, lint and build passed. Browser execution was blocked by sandbox localhost listening restrictions (`listen EPERM`); desktop/mobile visuals and E2E are NOT TESTED. Live Gemma quality, latency, real quotas, expert historical fidelity and exact model tokenizer behavior are NOT TESTED. Offline dependency audit reported zero known vulnerabilities; it is not a current online advisory review.

## Remaining limitations

Keyword search has no stemming, transliteration, semantic index, OCR or cross-language retrieval. Language detection is heuristic for short/mixed text. The model may hallucinate or follow injection attempts in prose despite system instructions; actual data access and citations remain server constrained. Excerpts do not guarantee narrative faithfulness. Production rollout requires a curated archive evaluation set and human historical/language review, distributed abuse controls for multiple instances and privacy-cleared public metadata. No deployment or live external test was performed.
