# Feedback storage setup

Feedback is stored in the existing Supabase project `altai-archive` (`isokkxsuqmcsaumbtxlt`) in the separate `public.feedback_messages` table. The additive migration is `supabase/migrations/20261111183714_feedback_messages.sql`; it does not alter archive tables.

The table has RLS enabled and forced. `anon` and `authenticated` have no table grants; the server role has INSERT only. There is no public read endpoint. The Next.js `POST /api/feedback` validates the payload, checks Origin/Fetch Metadata, applies the feedback-specific Upstash limiter, and returns success only after Supabase confirms the insert. Opaque `sb_secret_` keys are sent only as `apikey`; the legacy JWT service-role key is supported with the Bearer header. The key is read only by server code and is not exposed to browser bundles. The endpoint does not log submitted content or upstream error bodies.

## Vercel environment

Set these variables for the intended Vercel environments (Production and any Preview environments that should accept feedback):

- `SUPABASE_URL=https://isokkxsuqmcsaumbtxlt.supabase.co`
- `SUPABASE_SECRET_KEY` — the existing project's server-side secret key (`sb_secret_...`). The older `SUPABASE_SERVICE_ROLE_KEY` name is accepted temporarily if the project has only that legacy key. Set one server-side key, never a `NEXT_PUBLIC_*` variable.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — the existing Redis REST credentials. Feedback fails closed when the distributed limiter cannot be used.
- `APP_ORIGIN=https://altai-archive.vercel.app` — required by the existing same-origin protection.

No environment variable was added to `.env.local`, Vercel was not changed, and no secret was created. Configure values using the Vercel dashboard's encrypted Environment Variables UI, then redeploy manually when ready. Without Supabase credentials or Redis credentials the endpoint returns an error and does not claim that a message was received.

## Administrator access

Use the authenticated Supabase Dashboard for the existing project and its Table Editor to review `feedback_messages` and update status (`new`, `viewed`, `processed`). The current application admin sessions/users are stored in local JSON files and are not a safe Vercel authorization layer, so this change does not add an application admin page or a public read/update API. Restrict Supabase project membership to authorized staff and follow the organization's access process. Feedback is not published automatically.

## Consent and retention

Name and email are optional. If either is provided, the form requires the displayed consent text; the row records the consent version `feedback-contact-v1`. The text is prepared for this project and needs legal review before the form is used with real personal data. Define a retention and deletion period with the archive before inviting public submissions.
