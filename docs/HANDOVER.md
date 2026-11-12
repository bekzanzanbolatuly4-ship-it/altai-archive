# Project handover

## Ownership checklist

Transfer GitHub repository access, Vercel project ownership, Supabase project access, Upstash Redis access, domain DNS, and any licensed source media through each provider’s official team/ownership controls. This repository contains no ownership transfer action and none was performed by this work.

Use individual named accounts with MFA. Review the member list and remove the former owner only after the new owner has confirmed access to each provider, encrypted environment variables, domains, and recovery channels. Never transfer account passwords through Git or chat.

## Current state

- Public application and local test suites are in this repository.
- Supabase migrations are local files and were not applied remotely.
- Supabase visitor Auth/Turnstile flags are off by default; Production Auth and CAPTCHA have not been verified. Staff identity still uses the local demo store.
- Staff local JSON and uploaded files are not durable on Vercel. Keep the hosted admin read-only.
- Contact and source status is tracked in `docs/OFFICIAL_MATERIALS.md`.

## Backup and recovery

Before a release, export Supabase database schema and data using the project owner’s approved backup process, verify point-in-time recovery/retention in the provider dashboard, and separately back up private Storage objects if any are added. Encrypt backups, restrict access, and test a restore into a non-production project before relying on it. Back up the Vercel environment-variable inventory through the provider’s secure export/rotation workflow; do not put secret values in this repository.

The `.data` folder is ignored by Git and is not a backup system. Archive the local demo store only through a controlled, encrypted process and never merge it into production data without a reviewed migration.
