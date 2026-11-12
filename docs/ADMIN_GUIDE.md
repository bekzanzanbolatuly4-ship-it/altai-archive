# Administrator guide

## Current safe operating mode

The hosted portal is an informational demonstration. Keep `DEMO_READ_ONLY=true`. Do not enable archive mutations on Vercel: documents, sessions, staff demo data, and uploads still use `.data` on the local filesystem.

The checked-in visitor-auth and feedback-moderation migration is a review artifact and has not been applied to the connected Supabase project. `VISITOR_AUTH_ENABLED` and `NEXT_PUBLIC_VISITOR_AUTH_ENABLED` must remain false until the owner reviews and applies the migration, configures Auth email delivery and Upstash Redis, then completes real integration tests. CAPTCHA is not used by the application. Feedback classifications are private to Supabase Dashboard; there is no in-app review queue. Production staff migration and bootstrap are not implemented. No staff assignment or production account was created during this work.

## Isolated local staff demonstration

Run:

```bash
npm run admin:demo
```

The script makes a temporary isolated copy, seeds synthetic records, creates a random owner password in a mode-0600 file inside the temporary directory, and starts a local development server. Use that generated credential only for this local demonstration. Stop the server with Ctrl+C; the temporary copy and credentials are removed. Automated role tests run with:

```bash
npm run test:e2e:admin
```

This verifies local authorization behavior, not Supabase, Vercel, or production storage.

## Staff access

The existing demo has seven roles: SUPERADMIN, SITE_ADMIN, ARCHIVE_EMPLOYEE, EDITOR, BRANCH_ADMIN, MODERATOR, and ANALYST. The server checks permissions for admin APIs. The local demo role matrix is not a production identity system. Do not set passwords in source code or share credentials through chat.

Supabase staff authentication, role assignment, bootstrap, and transfer are not integrated with the application. The existing local demo roles do not establish production access.

## Incident or access removal

Until production staff authentication and storage are implemented and tested, manage service access through authorized provider owners. Do not use `.data` as a production staff directory.
