-- Member feedback from the dashboard (saved + emailed to admins).

create table public.member_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  category text,
  created_at timestamptz not null default now(),
  constraint member_feedback_message_len check (
    char_length(trim(message)) >= 3 and char_length(message) <= 4000
  ),
  constraint member_feedback_category_check check (
    category is null
    or category in ('general', 'bug', 'idea', 'program', 'other')
  )
);

comment on table public.member_feedback is
  'Feedback submitted by members from the dashboard.';

comment on column public.member_feedback.category is
  'Optional: general | bug | idea | program | other.';

create index member_feedback_created_at_idx
  on public.member_feedback (created_at desc);

create index member_feedback_user_id_idx
  on public.member_feedback (user_id);

alter table public.member_feedback enable row level security;

create policy "Users insert own feedback"
  on public.member_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users read own feedback"
  on public.member_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all feedback"
  on public.member_feedback
  for select
  to authenticated
  using (public.is_admin());
