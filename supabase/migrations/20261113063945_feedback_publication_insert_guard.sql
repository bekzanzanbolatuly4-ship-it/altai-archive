-- Authenticated visitors may submit their own private feedback only. Publication
-- consent and approval are written by the trusted server flow, never by clients.
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
    and public_consent = false
    and public_consent_version is null
    and public_display_name is null
    and publication_status = 'private'
    and publication_reviewed_at is null
    and publication_reviewed_by is null
    and exists (
      select 1 from public.visitor_profiles p
      where p.auth_user_id = (select auth.uid())
        and p.display_name = name
    )
  );
