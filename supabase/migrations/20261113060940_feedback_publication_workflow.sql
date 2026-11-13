-- Add an opt-in, staff-reviewed publication workflow. Existing rows remain private.
alter table public.feedback_messages
  add column if not exists public_consent boolean not null default false,
  add column if not exists public_consent_version text,
  add column if not exists public_display_name text,
  add column if not exists publication_status text not null default 'private',
  add column if not exists publication_reviewed_at timestamptz,
  add column if not exists publication_reviewed_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='feedback_publication_status_valid') then
    alter table public.feedback_messages add constraint feedback_publication_status_valid
      check (publication_status in ('private','pending','published','rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname='feedback_publication_requires_consent') then
    alter table public.feedback_messages add constraint feedback_publication_requires_consent
      check (publication_status='private' or (public_consent and public_consent_version is not null));
  end if;
  if not exists (select 1 from pg_constraint where conname='feedback_publication_published_valid') then
    alter table public.feedback_messages add constraint feedback_publication_published_valid
      check (publication_status<>'published' or (type='site_feedback' and rating between 1 and 5 and public_display_name is not null));
  end if;
end $$;

comment on column public.feedback_messages.public_consent is
  'Separate, explicit consent to publish first name, rating and website-review text after staff review.';
comment on column public.feedback_messages.publication_status is
  'private by default; pending requires consent; published only after explicit staff approval.';

-- Keep feedback inaccessible to anon/authenticated. The app reads approved rows via a server-only key.
revoke all on table public.feedback_messages from public, anon, authenticated;
grant select, insert, update, delete on table public.feedback_messages to service_role;
