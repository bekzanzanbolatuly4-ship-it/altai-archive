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

comment on column public.feedback_messages.auth_user_id is
  'Verified visitor account for submissions made after visitor auth rollout; nullable to preserve legacy rows.';

-- Keep feedback row access locked down. The application server retains insert-only access.
revoke all on table public.feedback_messages from public, anon, authenticated;
