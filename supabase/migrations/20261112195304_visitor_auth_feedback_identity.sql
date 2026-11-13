-- Visitor identities are separate from the existing staff profiles and roles.
-- Existing feedback rows remain valid: auth_user_id is intentionally nullable.
create table if not exists public.visitor_profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  consent_version text not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint visitor_consent_version check (consent_version = 'visitor-privacy-v1')
);

alter table public.visitor_profiles enable row level security;
alter table public.visitor_profiles force row level security;
revoke all on table public.visitor_profiles from public, anon, authenticated, service_role;
grant select on table public.visitor_profiles to authenticated;
create policy visitor_profile_select_own
  on public.visitor_profiles for select to authenticated
  using (auth.uid() = auth_user_id);

create or replace function public.create_visitor_profile_from_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_name text;
  submitted_consent text;
  submitted_at timestamptz;
begin
  -- Other trusted Auth provisioning flows (including existing staff) are not visitor sign-ups.
  if new.raw_user_meta_data ->> 'consent_version' is null then
    return new;
  end if;
  submitted_name := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  submitted_consent := coalesce(new.raw_user_meta_data ->> 'consent_version', '');
  submitted_at := now();
  if char_length(submitted_name) not between 1 and 80
     or submitted_consent <> 'visitor-privacy-v1'
     or submitted_at is null then
    raise exception 'Visitor profile consent is required';
  end if;
  insert into public.visitor_profiles(auth_user_id, display_name, consent_version, terms_accepted_at)
  values (new.id, submitted_name, submitted_consent, submitted_at);
  return new;
end;
$$;
revoke all on function public.create_visitor_profile_from_signup() from public, anon, authenticated, service_role;

drop trigger if exists create_visitor_profile_after_signup on auth.users;
create trigger create_visitor_profile_after_signup
after insert on auth.users
for each row execute function public.create_visitor_profile_from_signup();

alter table public.feedback_messages
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

-- Store assistive moderation metadata without changing original feedback text or legacy rows.
alter table public.feedback_messages
  add column if not exists moderation_category text,
  add column if not exists moderation_summary text,
  add column if not exists moderation_reason text,
  add column if not exists moderation_status text not null default 'needs_review';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'feedback_moderation_category_valid') then
    alter table public.feedback_messages add constraint feedback_moderation_category_valid
      check (moderation_category is null or moderation_category in ('constructive_criticism','suggestion','website_error','positive_feedback','spam','advertising','irrelevant','abusive'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_moderation_status_valid') then
    alter table public.feedback_messages add constraint feedback_moderation_status_valid
      check (moderation_status in ('classified','needs_review'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_moderation_summary_length') then
    alter table public.feedback_messages add constraint feedback_moderation_summary_length
      check (moderation_summary is null or char_length(moderation_summary) <= 240);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_moderation_reason_length') then
    alter table public.feedback_messages add constraint feedback_moderation_reason_length
      check (moderation_reason is null or char_length(moderation_reason) <= 300);
  end if;
end $$;

comment on column public.feedback_messages.auth_user_id is
  'Verified visitor account for submissions made after visitor auth rollout; nullable to preserve legacy rows.';

-- Keep legacy feedback row access locked down. Visitors may only create their
-- own confirmed-account submission; they cannot read/update/delete feedback.
revoke all on table public.feedback_messages from public, anon, authenticated;
grant insert on table public.feedback_messages to authenticated;
drop policy if exists feedback_visitor_insert_own on public.feedback_messages;
create policy feedback_visitor_insert_own
  on public.feedback_messages for insert to authenticated
  with check (
    auth.uid() = auth_user_id
    and email = (select auth.jwt() ->> 'email')
    and contact_consent = true
    and consent_version = 'feedback-contact-v1'
    and status = 'new'
    and moderation_category is null
    and moderation_summary is null
    and moderation_reason is null
    and moderation_status = 'needs_review'
    and exists (
      select 1 from public.visitor_profiles p
      where p.auth_user_id = (select auth.uid())
        and p.display_name = name
    )
  );
