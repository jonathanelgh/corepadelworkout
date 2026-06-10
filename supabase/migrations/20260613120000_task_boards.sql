-- Admin task boards (Trello-style): boards, columns, cards, assignees.

create table public.task_boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.task_boards is 'Admin Kanban boards for internal task management.';

create index task_boards_updated_at_idx on public.task_boards (updated_at desc);

create table public.task_board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.task_boards (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index task_board_columns_board_sort_idx on public.task_board_columns (board_id, sort_order);

create table public.task_cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.task_boards (id) on delete cascade,
  column_id uuid not null references public.task_board_columns (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_cards_column_sort_idx on public.task_cards (column_id, sort_order);
create index task_cards_board_idx on public.task_cards (board_id);

create table public.task_card_assignees (
  card_id uuid not null references public.task_cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

create index task_card_assignees_user_idx on public.task_card_assignees (user_id);

create trigger task_boards_set_updated_at
  before update on public.task_boards
  for each row
  execute function public.set_row_updated_at();

create trigger task_cards_set_updated_at
  before update on public.task_cards
  for each row
  execute function public.set_row_updated_at();

alter table public.task_boards enable row level security;
alter table public.task_board_columns enable row level security;
alter table public.task_cards enable row level security;
alter table public.task_card_assignees enable row level security;

create policy "Admins manage task boards"
  on public.task_boards for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage task board columns"
  on public.task_board_columns for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage task cards"
  on public.task_cards for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage task card assignees"
  on public.task_card_assignees for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
