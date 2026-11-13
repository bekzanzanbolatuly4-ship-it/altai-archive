-- Add optional star ratings without changing or deleting existing feedback.
-- New website-review submissions require 1–5 in the application validator;
-- older feedback rows and suggestions/bug reports may keep rating NULL.
alter table public.feedback_messages
  add column if not exists rating smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feedback_rating_range'
  ) then
    alter table public.feedback_messages
      add constraint feedback_rating_range
      check (rating is null or rating between 1 and 5);
  end if;
end $$;

comment on column public.feedback_messages.rating is
  'Optional 1–5 star rating for website feedback; NULL preserves legacy records and non-review submissions.';
