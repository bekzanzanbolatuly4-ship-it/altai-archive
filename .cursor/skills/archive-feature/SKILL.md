---
name: archive-feature
description: Implements and reviews ALTAI ARCHIVE features against product, localization, theme, governance, and security rules. Use when adding or changing catalog, document, exhibition, news, atlas, branch, assistant, or admin behavior, or when reviewing an archive change for safety.
---

# Archive feature

Follow `.cursor/rules/` while doing the work. This skill is the checklist for an archive change.

## Implement

1. Read the existing page, `components/portal.tsx` or `components/admin-workspace.tsx`, and the `lib/` or `app/api/` handler that already owns the behavior.
2. State whether the data is `demonstration` or `verified`. Do not fill unknown contacts, branches, or historical facts.
3. Reject the change if it adds payments, official applications, or document-ordering.
4. Put new UI copy in `locales/messages.ts` for `ru`, `kk`, and `en`.
5. Style with tokens from `app/globals.css`. Update light and dark together.
6. For any read or write of staff data, uploads, or unpublished documents, call `requireUser` with the existing permission. Keep account management on `SUPERADMIN`.
7. Return public DTOs only: `published` and `accessStatus: 'public'`.
8. Run `npm run typecheck`, `npm run lint`, and `npm run build`.

## Review

Report only issues in the diff. Use this order:

- **Block**: service ordering, invented official facts, missing server authorization, secret or unpublished-file exposure, a locale key missing in one language.
- **Fix**: hardcoded UI string, raw color, public route leaking a draft or `restricted` record, hero or type system replaced.
- **Note**: behavior preserved, with the commands that ran.

## Example

Input: “Show staff drafts on the public catalog.”

Output: refuse. Public catalog stays limited to published public records. Staff drafts remain behind `requireUser('read')` on `/api/admin/documents`.
