# Feedback storage setup

## Current status

Feedback is designed to use the existing Supabase project `altai-archive` (`isokkxsuqmcsaumbtxlt`) and existing `public.feedback_messages` table. The local additive identity and moderation migration is `supabase/migrations/20261112102918_visitor_auth_and_feedback_identity.sql`; it was not applied to the remote project.

The route code requires a verified Supabase session, confirmed email, a server-loaded profile name/email, consent, Upstash rate limiting, and a successful Supabase insert. CAPTCHA is intentionally not used. Gemini classification is best effort; if unavailable or uncertain, the stored row is marked `needs_review`. The endpoint returns success only after the insert. There is no public read endpoint for feedback. Review and apply the migration before enabling this flow in Production; no remote schema was changed.

## Enable only after review

The project owner must review and apply the migration through a controlled database workflow, configure Supabase Auth email confirmation and redirect URLs, and provide the required Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe values.
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the supported legacy service-role key) — server only.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — server only; limiter fails closed.
- `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` — exact HTTPS site origin.
- `NEXT_PUBLIC_VISITOR_AUTH_ENABLED=true` and `VISITOR_AUTH_ENABLED=true` only after those prerequisites and tests are complete.

No environment variables were added to `.env.local`, Vercel was not changed, and no remote migration was applied. Without configuration, registration and feedback fail closed and must not claim success. If CAPTCHA is enabled in Supabase Auth Dashboard, disable it: this application does not send CAPTCHA tokens.

## Review and retention

Authorized project members can review feedback in Supabase Dashboard. The app does not publish feedback or provide public access to other users’ messages. Name/email are sourced from the verified account profile; client overrides are ignored. The consent text needs legal review and the archive must approve retention/deletion periods before real public use.
