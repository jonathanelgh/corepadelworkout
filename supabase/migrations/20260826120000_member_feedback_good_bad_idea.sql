-- Allow dashboard feedback types: good / bad / ideas (keep legacy categories).

alter table public.member_feedback drop constraint if exists member_feedback_category_check;

alter table public.member_feedback add constraint member_feedback_category_check check (
  category is null
  or category in ('good', 'bad', 'idea', 'general', 'bug', 'program', 'other')
);

comment on column public.member_feedback.category is
  'Optional: good | bad | idea | general | bug | program | other.';
