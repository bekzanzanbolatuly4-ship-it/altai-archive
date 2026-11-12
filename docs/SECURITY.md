# Security and access status

## Current controls

- Administrative APIs call server-side authentication and permission checks; the existing role matrix is in `lib/archive-auth.ts`.
- Same-origin checks protect mutations. Feedback validates server-side identity and does not trust client-supplied names, email addresses, or user IDs.
- Feedback storage is separate from the archive content store; public read access is not provided.
- Local staff passwords are scrypt-hashed and sessions use an HTTP-only signed cookie. This filesystem-backed identity system is for local demonstration only, not Vercel.
- `.env*` files are ignored except `.env.example`; `.data` and local credentials are ignored.

## Release limits

Visitor Auth, distributed rate limiting, and Supabase staff membership remain disabled until configured and tested with the real project. CAPTCHA is not used. Local E2E and mocked integrations do not establish production readiness. Keep `DEMO_READ_ONLY=true`; do not use sample accounts or passwords in production. Do not place staff credentials in user metadata or client storage.

The existing Supabase project has a `public.profiles` role model, but staff sign-in and role assignment are not integrated into the application. Do not enable an undocumented feature flag as a workaround for missing persistence.

## Secret and incident handling

If a real credential is found in a provider or repository, rotate it in the owning provider first, then remove/rewrite exposure only through an approved repository history procedure. This work did not print secret values or rewrite Git history. For suspected account compromise, revoke sessions and provider access, rotate affected keys, preserve audit evidence, and test recovery before restoring service.
