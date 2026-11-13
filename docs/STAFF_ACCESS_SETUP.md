# Persistent staff access

Production staff sign-in uses Supabase Auth. A confirmed account receives staff access only while an active row exists in `public.profiles`; public registration never sets that role. The role is checked again on every protected request. Local `.data` staff accounts remain for local demonstrations only.

## Required Vercel settings

- `NEXT_PUBLIC_SUPABASE_URL` — the existing Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — its publishable key.
- `SUPABASE_SECRET_KEY` — the server-only Supabase secret key. Never use a `NEXT_PUBLIC_` prefix for this key.

Set the same production variables for the Vercel environment that serves the site. The secret key is used only by server routes for staff membership administration and must not be placed in browser code.

## Create the first SUPERADMIN

1. Register through the public account flow and confirm the email.
2. In Supabase Dashboard, open **Authentication → Users** and copy the UUID for that confirmed account.
3. Open **SQL Editor** for the existing `altai-archive` project and run this once, replacing the placeholder with that exact UUID:

   ```sql
   select private.bootstrap_first_superadmin('REPLACE_WITH_AUTH_USER_UUID'::uuid);
   ```

   The function refuses to run when an active SUPERADMIN already exists. It is in the non-exposed `private` schema and execution is revoked from application roles. Do not add it to an API route or client code.
4. Sign in at `/admin` with that account's Supabase email and password.

The bootstrap operation does not create or reset a password. Use Supabase Auth's password recovery if needed.

## Add or revoke staff

As SUPERADMIN, open `/admin` → **Сотрудники**, enter the exact email of an existing account with a confirmed email, choose a role, and assign it. Staff use their own Supabase Auth credentials. The site does not create staff passwords. Role changes and revocations take effect on the next protected request; the database prevents removing the last active SUPERADMIN and records membership changes in a restricted audit table.

Only SUPERADMIN can manage staff. Public users cannot read or write `profiles` or the staff audit table directly. No public staff registration is provided.

## Storage boundary

Staff identities and role assignments are persistent in Supabase. Archive document editing and uploads remain read-only in the Vercel deployment because the existing document store still uses local `.data` storage. Do not enable those write routes until document metadata and files have a persistent backend.
