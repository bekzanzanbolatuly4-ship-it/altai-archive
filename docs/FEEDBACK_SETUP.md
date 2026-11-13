# Feedback storage setup

## Current status

Feedback uses the existing Supabase project `altai-archive` (`isokkxsuqmcsaumbtxlt`) and existing `public.feedback_messages` table. The additive migrations `20261112195304_visitor_auth_feedback_identity.sql` and `20261112204700_feedback_staff_review_access.sql` were applied remotely on 2026-11-12. They preserve existing rows, add nullable account identity and moderation fields, and keep feedback unreadable to `anon` and `authenticated` roles.

The form no longer requires an account. First and last name are required; reply email is optional. A website review also requires a 1–5 star rating. Consent, same-origin checks, bounded input, a hidden honeypot, per-IP/per-email limits, duplicate-message throttling, and a global hourly limit protect submissions. The IP and duplicate-message fingerprints are hashed before storage in Redis. Production rate limiting fails closed if Upstash is unavailable. CAPTCHA remains intentionally disabled. These controls reduce common automated spam but are not a guarantee against distributed attacks. Gemini moderation receives only the message text; missing or uncertain classification is saved as `needs_review`. The endpoint returns success only after Supabase confirms the insert. There is no public read endpoint for feedback.

Migration `20261113041246_feedback_star_rating.sql` was applied to the existing Supabase project on 2026-11-13. It adds a nullable `rating` column with a 1–5 constraint; existing rows remain valid with `NULL`. The application now maps consent to the existing `contact_consent` database column. The staff review endpoint can sort by date or rating and still requires the existing staff permission check and server-only Supabase key. Production staff accounts still use the existing `.data` auth and are not durable on Vercel, so this review UI is not a Production-ready staff workflow.

## Enable only after review

The project owner must configure Supabase Auth email confirmation and allow the deployed callback URL (`https://altai-archive.vercel.app/auth/callback`) in Supabase Auth redirect settings. Recommended Vercel environment variables are:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe publishable values (the current project publishable key is also used as a code fallback; it is not a secret).
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the supported legacy service-role key) — server only; needed for AI moderation persistence and staff feedback review.
- `GEMINI_API_KEY` — server only; enables Gemini assistant and optional feedback classification.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — server only; limiter fails closed.
- `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` — exact HTTPS site origin.

`APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` must be the same exact HTTPS origin.

Verification on 2026-11-13: the rating column and its constraint were confirmed in the connected Supabase project; the feedback RLS policies and grants were checked and still deny public reads. Local unit tests cover anonymous validation, server-side moderation, mapping, and confirmed-insert behavior. No live feedback row was created, so end-to-end Production submission remains unverified until the deployed Vercel server secrets and Redis limiter are confirmed. The Supabase publishable key is intentionally browser-visible and protected by RLS; never expose the Supabase secret, Gemini key, or Redis token.

## Review and retention

Authorized project members can review feedback in Supabase Dashboard; the server review API is permission-checked and private. The app does not publish feedback or provide public access to messages. The form accepts an optional reply email; the user-supplied name and message are stored as submitted, while the server-generated moderation label does not alter the original text. The archive must approve the consent wording and retention/deletion period before real public use.
