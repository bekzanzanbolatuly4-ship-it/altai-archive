# Deployment and external services

## Vercel

Use the repository’s Next.js build command `npm run build`. Configure `APP_ORIGIN` and `NEXT_PUBLIC_SITE_URL` to the exact HTTPS deployment origin. Keep `DEMO_READ_ONLY=true`. Do not enable visitor or staff Auth feature flags until the owner has applied and verified the reviewed SQL migrations, configured email confirmation/redirect URLs and Upstash, and tested the real service path. CAPTCHA is not used by this application; disable it in Supabase Auth if it is enabled there.

The Vercel filesystem is ephemeral. `.data` metadata, staff demo accounts, sessions, and uploads are not durable there. Do not present document upload/publication or staff management as production-ready.

## Supabase

Project reference: `isokkxsuqmcsaumbtxlt` (`altai-archive`). Do not create another project. Migrations in `supabase/migrations/` have not been applied by this work. Review the complete migration chain first; the repository is missing the original migration `20261110051224_altai_archive_initial_schema`, while the remote project reports it as applied. Do not reset or apply a reconstructed baseline to the existing project.

Server-only keys: `SUPABASE_SECRET_KEY` (preferred) or the supported legacy `SUPABASE_SERVICE_ROLE_KEY`; publishable client key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `NEXT_PUBLIC_SUPABASE_URL` is public. Do not put server secrets in `NEXT_PUBLIC_*`, logs, or Git.

## Other configuration

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: server-only; needed for distributed public rate limiting.
- `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL`: server-only model configuration; enable only with archive privacy approval.

Set these values using the Vercel encrypted Environment Variables UI. `.env.example` contains placeholders only. No secrets or hosted settings were changed during this work. Deployment itself remains the owner’s action.
