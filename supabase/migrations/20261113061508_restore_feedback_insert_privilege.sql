-- Preserve the existing verified-user insert path; RLS still limits each insert to its own account.
grant insert on table public.feedback_messages to authenticated;
