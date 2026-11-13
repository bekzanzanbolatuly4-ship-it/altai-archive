# Feedback storage setup

## Current status

Feedback uses the existing Supabase project `altai-archive` (`isokkxsuqmcsaumbtxlt`) and existing `public.feedback_messages` table. The additive migrations `20261112195304_visitor_auth_feedback_identity.sql` and `20261112204700_feedback_staff_review_access.sql` were applied remotely on 2026-11-12. They preserve existing rows, add nullable account identity and moderation fields, and keep feedback unreadable to `anon` and `authenticated` roles.

The route requires a verified Supabase session, confirmed email, a server-loaded profile name/email, consent, Upstash rate limiting, and a successful Supabase insert. CAPTCHA is intentionally not used. Gemini classification runs only when both `GEMINI_API_KEY` and a server-only `SUPABASE_SECRET_KEY` (or supported legacy service-role key) are configured; absent/uncertain classification stays `needs_review`. The endpoint returns success only after the insert. There is no public read endpoint for feedback. The staff review endpoint sorts by newest/oldest and requires the existing staff permission check plus the server-only Supabase key. Production staff accounts still use the existing `.data` auth and are not durable on Vercel, so this review UI is not a Production-ready staff workflow.

## Enable only after review

The project owner must configure Supabase Auth email confirmation and allow the deployed callback URL (`https://altai-archive.vercel.app/auth/callback`) in Supabase Auth redirect settings. Recommended Vercel environment variables are:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe publishable values (the current project publishable key is also used as a code fallback; it is not a secret).
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the supported legacy service-role key) — server only; needed for AI moderation persistence and staff feedback review.
- `GEMINI_API_KEY` — server only; enables Gemini assistant and optional feedback classification.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — server only; limiter fails closed.
- `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` — exact HTTPS site origin.

`APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` must be the same exact HTTPS origin.

Verification on 2026-11-13: the local `.env.local` supplies `GEMINI_API_KEY`; a real request through the app's `/api/assistant` returned an AI response with validated citations in Russian and Kazakh. The same Gemini model classified a synthetic, non-personal feedback sample as `website_error`. The API key was not printed or returned to the browser. The Supabase secret key was not present in the local environment, and Vercel environment settings were not inspected. Therefore this does **not** verify saving moderation results or the full registration → confirmed session → feedback insert flow. Do not claim those flows are production-verified until tested with a confirmed test account and the deployed server-side Supabase secret. The Supabase publishable key is intentionally browser-visible and protected by RLS; never expose the Supabase secret, Gemini key, or Redis token. If CAPTCHA is enabled in Supabase Auth Dashboard, disable it: this application does not send CAPTCHA tokens.

## Review and retention

Authorized project members can review feedback in Supabase Dashboard; the server review API is permission-checked and private. The app does not publish feedback or provide public access to other users’ messages. Name/email are sourced from the verified account profile; client overrides are ignored. The consent text needs legal review and the archive must approve retention/deletion periods before real public use.
