-- DESIGN REFERENCE ONLY. Split with Supabase CLI into migrations.
-- Requires Supabase auth/storage schemas. Never apply to production unreviewed.
begin;
create schema if not exists private;
revoke all on schema private from public;
create type public.staff_role as enum ('SUPERADMIN','SITE_ADMIN','ARCHIVE_EMPLOYEE','EDITOR','BRANCH_ADMIN','MODERATOR','ANALYST');
create type public.document_status as enum ('draft','review','approved','published','archived');
create table public.profiles (
 id text primary key, auth_user_id uuid unique references auth.users(id),
 display_name text not null, role public.staff_role not null,
 disabled boolean not null default true, created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role) where not disabled;
-- Email remains in Auth. SafeUser.email is composed server-side from verified Auth identity.
create table public.documents (
 id text primary key, title text not null check(length(title) between 1 and 250),
 description text not null default '' check(length(description)<=4000),
 date_text text not null default '', fond text not null default '', inventory text not null default '',
 case_name text not null default '', document_identifier text not null default '',
 keywords text[] not null default '{}' check(cardinality(keywords)<=30),
 language text not null default '', provenance text not null default '',
 provenance_kind text not null default 'unverified' check(provenance_kind in ('unverified','verified','demonstration')),
 access_status text not null default 'restricted' check(access_status in ('public','restricted')),
 status public.document_status not null default 'draft', external_ai_allowed boolean not null default false,
 version bigint not null default 1 check(version>0), created_by text not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 search_vector tsvector generated always as (to_tsvector('simple'::regconfig,title || ' ' || description || ' ' || document_identifier)) stored
);
create index documents_public_idx on public.documents(created_at desc,id) where status='published' and access_status='public' and deleted_at is null;
create index documents_creator_idx on public.documents(created_by);
create index documents_search_idx on public.documents using gin(search_vector);
create index documents_keywords_idx on public.documents using gin(keywords);
create table public.document_versions (
 document_id text not null references public.documents(id), version bigint not null check(version>0),
 metadata jsonb not null check(jsonb_typeof(metadata)='object'),
 actor_id text not null references public.profiles(id), created_at timestamptz not null default now(),
 primary key(document_id,version)
);
create index document_versions_actor_idx on public.document_versions(actor_id);
create table public.document_translations (
 document_id text not null references public.documents(id), locale text not null check(locale in ('ru','kk','en')),
 title text not null, description text not null default '', source_version bigint not null,
 reviewed boolean not null default false, primary key(document_id,locale),
 foreign key(document_id,source_version) references public.document_versions(document_id,version)
);
create table private.files (
 id uuid primary key default gen_random_uuid(), document_id text references public.documents(id),
 bucket text not null check(bucket in ('archive-originals','archive-derived')),
 object_key text not null, original_name text not null, mime_type text not null,
 byte_size bigint not null check(byte_size>0 and byte_size<=26214400),
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 state text not null default 'pending' check(state in ('pending','verified','quarantined')),
 kind text not null check(kind in ('original','ocr','thumbnail')),
 created_by text not null references public.profiles(id), created_at timestamptz not null default now(),
 unique(bucket,object_key)
);
create index files_document_idx on private.files(document_id);
create index files_creator_idx on private.files(created_by);
create unique index files_one_original_idx on private.files(document_id) where kind='original' and state='verified';
create table private.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id text references public.profiles(id),
 legacy_actor text, action text not null, entity_type text not null, entity_id text not null,
 request_id uuid, at timestamptz not null default now(), details jsonb not null default '{}'
);
create index audit_time_idx on private.audit_logs(at desc);
create index audit_actor_idx on private.audit_logs(actor_id,at desc);
create index audit_entity_idx on private.audit_logs(entity_type,entity_id,at desc);
create table private.requests (
 actor_id text not null references public.profiles(id), request_id uuid not null,
 payload_sha256 text not null check(payload_sha256 ~ '^[0-9a-f]{64}$'),
 result jsonb not null, created_at timestamptz not null default now(), primary key(actor_id,request_id)
);
create table public.editorial_items (
 id text primary key, kind text not null check(kind in ('collection','exhibition','news','branch','place')),
 slug text not null, localized_content jsonb not null check(jsonb_typeof(localized_content)='object'),
 provenance text not null, provenance_kind text not null check(provenance_kind in ('verified','demonstration','unverified')),
 status public.document_status not null default 'draft', version bigint not null default 1 check(version>0),
 created_by text not null references public.profiles(id), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), deleted_at timestamptz, unique(kind,slug)
);
create index editorial_creator_idx on public.editorial_items(created_by);
create index editorial_published_idx on public.editorial_items(kind,created_at desc) where status='published' and deleted_at is null;
create table public.editorial_documents (
 editorial_id text not null references public.editorial_items(id), document_id text not null references public.documents(id),
 position integer not null check(position>=0), primary key(editorial_id,document_id), unique(editorial_id,position)
);
create index editorial_documents_doc_idx on public.editorial_documents(document_id);
create table private.migration_batches (
 id uuid primary key default gen_random_uuid(), snapshot_sha256 text not null unique,
 state text not null check(state in ('prepared','imported','verified','cutover','rolled_back')),
 manifest jsonb not null, created_at timestamptz not null default now()
);
create table private.document_chunks (
 id uuid primary key default gen_random_uuid(), document_id text not null references public.documents(id),
 document_version bigint not null, file_id uuid references private.files(id),
 ordinal integer not null check(ordinal>=0), page integer check(page>0), content text not null,
 source_sha256 text not null check(source_sha256 ~ '^[0-9a-f]{64}$'), method text not null,
 extractor_version text not null, reviewed boolean not null default false,
 search_vector tsvector generated always as (to_tsvector('simple'::regconfig,content)) stored,
 foreign key(document_id,document_version) references public.document_versions(document_id,version),
 unique(document_id,document_version,ordinal)
);
create index chunks_search_idx on private.document_chunks using gin(search_vector);
create index chunks_file_idx on private.document_chunks(file_id);
create table private.jobs (
 id uuid primary key default gen_random_uuid(), file_id uuid not null references private.files(id),
 kind text not null check(kind in ('extract','ocr','embed','verify')),
 state text not null default 'queued' check(state in ('queued','running','done','failed')),
 attempts integer not null default 0 check(attempts>=0), lease_until timestamptz,
 worker_version text not null, error_code text, created_at timestamptz not null default now(),
 unique(file_id,kind,worker_version)
);
create index jobs_queue_idx on private.jobs(state,lease_until);
create table private.ai_budgets (
 day date primary key, limit_usd numeric(12,6) not null check(limit_usd>=0),
 reserved_usd numeric(12,6) not null default 0 check(reserved_usd>=0),
 spent_usd numeric(12,6) not null default 0 check(spent_usd>=0)
);
create table private.ai_requests (
 id uuid primary key, subject_hash text not null, model text not null,
 state text not null check(state in ('reserved','running','done','failed','unknown')),
 reserved_usd numeric(12,6) not null check(reserved_usd>=0), actual_usd numeric(12,6),
 input_tokens integer, output_tokens integer, error_code text, created_at timestamptz not null default now()
);
create index ai_requests_subject_idx on private.ai_requests(subject_hash,created_at desc);

-- Narrow definer lookup avoids profile-policy recursion and checks revoked sessions.
create function private.has_permission(permission text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (
 select 1 from public.profiles p
 where p.auth_user_id=(select auth.uid()) and not p.disabled
 and exists(select 1 from auth.sessions s where s.id::text=(auth.jwt()->>'session_id') and s.user_id=p.auth_user_id)
 and case permission
 when 'read' then true
 when 'upload' then p.role in ('SUPERADMIN','SITE_ADMIN','ARCHIVE_EMPLOYEE','BRANCH_ADMIN')
 when 'edit' then p.role in ('SUPERADMIN','SITE_ADMIN','ARCHIVE_EMPLOYEE','EDITOR','BRANCH_ADMIN','MODERATOR')
 when 'publish' then p.role in ('SUPERADMIN','SITE_ADMIN','EDITOR')
 when 'accounts' then p.role='SUPERADMIN'
 when 'audit' then p.role in ('SUPERADMIN','SITE_ADMIN','ANALYST')
 else false end)
$$;
revoke all on function private.has_permission(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_permission(text) to authenticated;

-- Deny writes by default, even if project has permissive default grants.
do $$ declare r record; begin
 for r in select schemaname,tablename from pg_tables where schemaname in ('public','private') and tablename in
 ('profiles','documents','document_versions','document_translations','files','audit_logs','requests','editorial_items','editorial_documents','migration_batches','document_chunks','jobs','ai_budgets','ai_requests') loop
 execute format('alter table %I.%I enable row level security',r.schemaname,r.tablename);
 execute format('revoke all on table %I.%I from public, anon, authenticated',r.schemaname,r.tablename);
 end loop;
end $$;
grant select on public.documents,public.document_translations,public.editorial_items,public.editorial_documents to anon,authenticated;
grant select on public.profiles,public.document_versions,private.files,private.audit_logs to authenticated;
create policy documents_public on public.documents for select to anon,authenticated
 using(status='published' and access_status='public' and deleted_at is null);
create policy documents_staff on public.documents for select to authenticated using(private.has_permission('read'));
create policy profiles_staff on public.profiles for select to authenticated
 using(private.has_permission('accounts') or (auth_user_id=(select auth.uid()) and private.has_permission('read')));
create policy versions_staff on public.document_versions for select to authenticated using(private.has_permission('read'));
create policy files_staff on private.files for select to authenticated using(private.has_permission('read'));
create policy audit_staff on private.audit_logs for select to authenticated using(private.has_permission('audit'));
create policy translations_public on public.document_translations for select to anon,authenticated
 using(reviewed and exists(select 1 from public.documents d where d.id=document_id and d.version=source_version and d.status='published' and d.access_status='public' and d.deleted_at is null));
create policy translations_staff on public.document_translations for select to authenticated using(private.has_permission('read'));
create policy editorial_public on public.editorial_items for select to anon,authenticated
 using(status='published' and deleted_at is null and provenance_kind in ('verified','demonstration'));
create policy editorial_staff on public.editorial_items for select to authenticated using(private.has_permission('read'));
create policy editorial_links_public on public.editorial_documents for select to anon,authenticated using(
 exists(select 1 from public.editorial_items e where e.id=editorial_id and e.status='published' and e.deleted_at is null and e.provenance_kind in ('verified','demonstration'))
 and exists(select 1 from public.documents d where d.id=document_id and d.status='published' and d.access_status='public' and d.deleted_at is null));
create policy editorial_links_staff on public.editorial_documents for select to authenticated using(private.has_permission('read'));

-- No client grants/policies on chunks/jobs/budgets/requests/migration tables.
-- Implement narrow backend retrieval RPC with explicit public+AI permission predicate;
-- never expose raw chunks. Mutation RPC contracts are specified in the blueprint.
-- For public file lookup implement a narrow RPC returning only verified original
-- of a current published/public/nondeleted document; file keys remain server-side.
-- All audit/version insertions occur inside mutation RPC transactions.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('archive-originals','archive-originals',false,26214400,array['application/pdf','image/jpeg','image/png','image/webp','image/tiff']),
 ('archive-derived','archive-derived',false,26214400,array['text/plain','application/json','image/png','image/jpeg']),
 ('site-assets','site-assets',true,5242880,array['image/png','image/jpeg','image/webp']);
-- Intentionally no storage.objects policies for client roles.
-- Inspect pre-existing policies: any broad permissive policy is a release blocker.
commit;
