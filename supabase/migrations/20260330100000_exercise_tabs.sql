-- Exercise “tabs” (tag vocabulary): title only on the lookup table.
-- Many-to-many between exercises and exercise_tabs via exercise_tab_links.

create table public.exercise_tabs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_tabs_title_unique unique (title)
);

comment on table public.exercise_tabs is 'Reusable labels (e.g. tags) that can be attached to many exercises.';

create index exercise_tabs_title_idx on public.exercise_tabs (title);

create table public.exercise_tab_links (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  exercise_tab_id uuid not null references public.exercise_tabs (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, exercise_tab_id)
);

comment on table public.exercise_tab_links is 'Many-to-many: exercises can have multiple exercise_tabs.';

create index exercise_tab_links_tab_id_idx on public.exercise_tab_links (exercise_tab_id);

create trigger exercise_tabs_set_updated_at
  before update on public.exercise_tabs
  for each row
  execute function public.set_row_updated_at();

alter table public.exercise_tabs enable row level security;
alter table public.exercise_tab_links enable row level security;

create policy "Exercise tabs are readable by everyone"
  on public.exercise_tabs for select
  to anon, authenticated
  using (true);

create policy "Admins can insert exercise tabs"
  on public.exercise_tabs for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update exercise tabs"
  on public.exercise_tabs for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete exercise tabs"
  on public.exercise_tabs for delete
  to authenticated
  using (public.is_admin());

create policy "Exercise tab links are readable by everyone"
  on public.exercise_tab_links for select
  to anon, authenticated
  using (true);

create policy "Admins can insert exercise tab links"
  on public.exercise_tab_links for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update exercise tab links"
  on public.exercise_tab_links for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete exercise tab links"
  on public.exercise_tab_links for delete
  to authenticated
  using (public.is_admin());
