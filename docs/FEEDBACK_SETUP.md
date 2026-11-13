# Feedback storage setup

## Current status

Feedback uses the existing Supabase project `altai-archive` (`isokkxsuqmcsaumbtxlt`) and existing `public.feedback_messages` table. The additive migrations `20261112195304_visitor_auth_feedback_identity.sql` and `20261112204700_feedback_staff_review_access.sql` were applied remotely on 2026-11-12. They preserve existing rows, add nullable account identity and moderation fields, and keep feedback unreadable to `anon` and `authenticated` roles.

Feedback submission requires a signed-in account with a confirmed email. The form displays the account name and email from the server-verified Supabase session; clients cannot provide or override that identity. Guests see sign-in and registration links. A website review also requires a 1–5 star rating. Consent, same-origin checks, bounded input, a hidden honeypot, per-IP/per-account limits, duplicate-message throttling, and a global hourly limit protect submissions. The IP and duplicate-message fingerprints are hashed before storage in Redis. Production rate limiting fails closed if Upstash is unavailable. CAPTCHA remains intentionally disabled. These controls reduce common automated spam but are not a guarantee against distributed attacks. Gemini moderation receives only the message text; missing or uncertain classification is saved as `needs_review`. The endpoint returns success only after Supabase confirms the insert.

## Public reviews and staff queue

The publication workflow migrations `20261113060940_feedback_publication_workflow.sql` and `20261113063945_feedback_publication_insert_guard.sql` add separate publication consent, a private-by-default status, and an RLS guard that prevents authenticated clients from self-publishing. A visitor may opt in only for a website review; only a derived first name, rating and message can be shown. New opted-in reviews begin as `pending`. Suggestions and bug reports remain private. Existing feedback rows were not backfilled with consent and stay private. The public endpoint returns only approved rows and an allowlisted DTO; it never returns email, surname, account ID, moderation notes or private messages. Anonymous direct database reads remain disabled.

The staff queue supports type and AI-status filters, text search, sorting, manual publish/unpublish, and deletion for `SUPERADMIN`/`SITE_ADMIN`. AI classification is advisory and never publishes or deletes a message. Publication requires explicit user consent and a staff action. The existing staff auth/store is file-based and not durable on Vercel; therefore the queue controls are not a reliable Production staff workflow until staff authentication is migrated to persistent server-verified storage. In the meantime, the owner can manage approved visibility in Supabase Dashboard. Do not display that workflow as Production-ready until the staff auth limitation is addressed.

Migration `20261113041246_feedback_star_rating.sql` was applied to the existing Supabase project on 2026-11-13. It adds a nullable `rating` column with a 1–5 constraint; existing rows remain valid with `NULL`. The application now maps consent to the existing `contact_consent` database column. The staff review endpoint can sort by date or rating and still requires the existing staff permission check and server-only Supabase key. Production staff accounts still use the existing `.data` auth and are not durable on Vercel, so this review UI is not a Production-ready staff workflow.

## Enable only after review

The project owner must configure Supabase Auth email confirmation and allow the deployed callback URL (`https://altai-archive.vercel.app/auth/callback`) in Supabase Auth redirect settings. Recommended Vercel environment variables are:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe publishable values (the current project publishable key is also used as a code fallback; it is not a secret).
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the supported legacy service-role key) — server only; needed for AI moderation persistence and staff feedback review.
- `GEMINI_API_KEY` — server only; enables Gemini assistant and optional feedback classification.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — server only; limiter fails closed.
- `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` — exact HTTPS site origin.

`APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` must be the same exact HTTPS origin.

Verification on 2026-11-13: the rating column and its constraint were confirmed in the connected Supabase project; the feedback RLS policies and grants were checked and still deny public reads. Local unit tests cover authenticated validation, server-side moderation, mapping, and confirmed-insert behavior. No live feedback row was created, so end-to-end Production submission remains unverified until the deployed Vercel server secrets, Auth configuration, and Redis limiter are confirmed. The Supabase publishable key is intentionally browser-visible and protected by RLS; never expose the Supabase secret, Gemini key, or Redis token.

## Review and retention

Authorized project members can review feedback in Supabase Dashboard; the server review API is permission-checked and private. Account name and confirmed email are stored with the message, and the server-generated moderation label does not alter the original text. Public display is limited to separately consented, manually approved website reviews. Automatic deletion periods are not configured; agree and document a retention schedule before wider Production use.
