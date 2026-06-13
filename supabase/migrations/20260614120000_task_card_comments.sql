-- Threaded comments on task cards (admin task boards).

create table public.task_card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.task_cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index task_card_comments_card_created_idx
  on public.task_card_comments (card_id, created_at asc);

alter table public.task_card_comments enable row level security;

create policy "Admins manage task card comments"
  on public.task_card_comments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
