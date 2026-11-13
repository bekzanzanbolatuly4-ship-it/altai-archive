-- Persistent staff membership metadata and a one-time owner bootstrap path.
-- Existing public profiles/visitor accounts are preserved; no user is promoted here.
alter table public.profiles
  add column if not exists granted_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.staff_membership_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid not null,
  action text not null check (action in ('granted','changed','revoked','bootstrap')),
  previous_role public.staff_role,
  new_role public.staff_role,
  new_disabled boolean,
  created_at timestamptz not null default now()
);
alter table public.staff_membership_audit enable row level security;
alter table public.staff_membership_audit force row level security;
revoke all on table public.staff_membership_audit from public, anon, authenticated;
grant all on table public.staff_membership_audit to service_role;

create or replace function private.guard_last_superadmin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_id text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('altai-archive:superadmin-membership', 0));
  if tg_op = 'DELETE' then
    old_id := old.id;
    if old.role = 'SUPERADMIN' and not old.disabled and not exists (
      select 1 from public.profiles p where p.id <> old_id and p.role = 'SUPERADMIN' and not p.disabled
    ) then
      raise exception 'Cannot remove the last active SUPERADMIN';
    end if;
    return old;
  end if;
  if old.role = 'SUPERADMIN' and not old.disabled
     and (new.role <> 'SUPERADMIN' or new.disabled)
     and not exists (
       select 1 from public.profiles p where p.id <> old.id and p.role = 'SUPERADMIN' and not p.disabled
     ) then
    raise exception 'Cannot remove the last active SUPERADMIN';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_last_superadmin() from public, anon, authenticated, service_role;
drop trigger if exists guard_last_superadmin on public.profiles;
create trigger guard_last_superadmin before update or delete on public.profiles
for each row execute function private.guard_last_superadmin();

create or replace function private.audit_staff_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  actor uuid;
  previous_role public.staff_role;
  assigned_role public.staff_role;
  current_disabled boolean;
  event_action text;
begin
  if tg_op = 'DELETE' then
    target_id := old.auth_user_id;
    actor := old.granted_by;
    previous_role := old.role;
    event_action := 'revoked';
  else
    target_id := new.auth_user_id;
    actor := new.granted_by;
    assigned_role := new.role;
    current_disabled := new.disabled;
    if tg_op = 'INSERT' then
      event_action := case when new.role = 'SUPERADMIN' and new.granted_by is null then 'bootstrap' else 'granted' end;
    elsif old.role is distinct from new.role or old.disabled is distinct from new.disabled then
      previous_role := old.role;
      event_action := case when old.disabled is false and new.disabled is true then 'revoked' else 'changed' end;
    else
      return new;
    end if;
  end if;
  insert into public.staff_membership_audit(actor_id,target_user_id,action,previous_role,new_role,new_disabled)
  values(actor,target_id,event_action,previous_role,assigned_role,current_disabled);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.audit_staff_membership() from public, anon, authenticated, service_role;
drop trigger if exists audit_staff_membership on public.profiles;
create trigger audit_staff_membership after insert or update or delete on public.profiles
for each row execute function private.audit_staff_membership();

create or replace function private.bootstrap_first_superadmin(target_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
  target_name text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('altai-archive:superadmin-membership', 0));
  if exists(select 1 from public.profiles p where p.role = 'SUPERADMIN' and not p.disabled) then
    raise exception 'An active SUPERADMIN already exists';
  end if;
  select u.email, coalesce(nullif(v.display_name,''), nullif(u.raw_user_meta_data ->> 'display_name',''), split_part(u.email,'@',1))
    into target_email,target_name
  from auth.users u
  left join public.visitor_profiles v on v.auth_user_id = u.id
  where u.id = target_auth_user_id and u.email_confirmed_at is not null;
  if target_email is null then
    raise exception 'Target must be an existing user with a confirmed email';
  end if;
  insert into public.profiles(id,auth_user_id,display_name,role,disabled,granted_by,updated_at)
  values(target_auth_user_id::text,target_auth_user_id,target_name,'SUPERADMIN',false,null,now())
  on conflict(auth_user_id) do update set
    display_name = excluded.display_name,
    role = 'SUPERADMIN',
    disabled = false,
    granted_by = null,
    updated_at = now();
end;
$$;
revoke all on function private.bootstrap_first_superadmin(uuid) from public, anon, authenticated, service_role;

comment on function private.bootstrap_first_superadmin(uuid) is
  'Infrastructure-owner-only, one-time bootstrap from Supabase SQL Editor. Not exposed to application roles.';
comment on table public.staff_membership_audit is
  'Private audit trail for staff role grants and revocations; unavailable to browser roles.';
