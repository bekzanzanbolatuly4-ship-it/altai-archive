create table public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('site_feedback', 'suggestion', 'site_bug')),
  name text,
  email text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'viewed', 'processed')),
  contact_consent boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now(),
  constraint feedback_name_length check (name is null or char_length(name) between 1 and 80),
  constraint feedback_email_format check (
    email is null or (
      char_length(email) <= 254
      and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    )
  ),
  constraint feedback_message_length check (char_length(message) between 10 and 2000),
  constraint feedback_contact_requires_consent check (
    (name is null and email is null)
    or (contact_consent and consent_version is not null)
  ),
  constraint feedback_consent_version_consistent check (
    (not contact_consent and consent_version is null)
    or (contact_consent and consent_version is not null)
  )
);

comment on table public.feedback_messages is
  'Private feedback about the informational ALTAI ARCHIVE website. Not official requests or archive-service applications.';

alter table public.feedback_messages enable row level security;
alter table public.feedback_messages force row level security;

-- This table is in the exposed public schema, so explicitly remove default grants.
revoke all on table public.feedback_messages from public, anon, authenticated, service_role;

-- The application server may submit rows only. It has no Data API read or update access.
grant insert on table public.feedback_messages to service_role;
create policy feedback_server_insert_only
  on public.feedback_messages
  for insert
  to service_role
  with check (true);
