# Feedback storage setup

## Current status

Feedback is designed to use the existing Supabase project `altai-archive` (`isokkxsuqmcsaumbtxlt`) and existing `public.feedback_messages` table. The local additive identity migration is `supabase/migrations/20261112102918_visitor_auth_and_feedback_identity.sql`; it was not applied to the remote project.

The route code requires a verified Supabase session, confirmed email, a server-loaded profile name/email, consent, server-side Cloudflare Turnstile verification, Upstash rate limiting, and a successful Supabase insert. It returns success only after the insert. There is no public read endpoint for feedback. This external integration has not been verified with real credentials.

## Enable only after review

The project owner must review and apply the migration through a controlled database workflow, configure Supabase Auth email confirmation and redirect URLs, configure the official Cloudflare Turnstile CAPTCHA in Supabase Auth, and provide the required Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe values.
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the supported legacy service-role key) — server only.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — server only; limiter fails closed.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public widget key.
- `TURNSTILE_SECRET_KEY` and `TURNSTILE_ALLOWED_HOSTNAMES` — server-only verification settings.
- `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` — exact HTTPS site origin.
- `NEXT_PUBLIC_VISITOR_AUTH_ENABLED=true` and `VISITOR_AUTH_ENABLED=true` only after those prerequisites and tests are complete.

No environment variables were added to `.env.local`, Vercel was not changed, and no remote migration was applied. Without configuration, registration and feedback fail closed and must not claim success.

## Review and retention

Authorized project members can review feedback in Supabase Dashboard. The app does not publish feedback or provide public access to other users’ messages. Name/email are sourced from the verified account profile; client overrides are ignored. The consent text needs legal review and the archive must approve retention/deletion periods before real public use.
