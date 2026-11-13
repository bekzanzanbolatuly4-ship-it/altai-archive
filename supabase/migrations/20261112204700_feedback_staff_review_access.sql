-- Permit privileged server-side review only. Public and authenticated visitor
-- roles still cannot read feedback or alter moderation results.
grant select on table public.feedback_messages to service_role;
grant update (moderation_category, moderation_summary, moderation_reason, moderation_status)
  on table public.feedback_messages to service_role;

drop policy if exists feedback_service_role_select on public.feedback_messages;
create policy feedback_service_role_select
  on public.feedback_messages for select to service_role
  using (true);

drop policy if exists feedback_service_role_moderate on public.feedback_messages;
create policy feedback_service_role_moderate
  on public.feedback_messages for update to service_role
  using (true)
  with check (true);
