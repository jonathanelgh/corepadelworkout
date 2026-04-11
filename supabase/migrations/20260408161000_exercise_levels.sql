-- Exercise difficulty / experience level (single optional FK per exercise).

create table if not exists public.exercise_levels (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint exercise_levels_slug_key unique (slug)
);

comment on table public.exercise_levels is 'Taxonomy: difficulty / experience tier for an exercise.';

create index if not exists exercise_levels_sort_order_idx on public.exercise_levels (sort_order);

alter table public.exercise_levels enable row level security;

drop policy if exists "Exercise levels are readable by everyone" on public.exercise_levels;
create policy "Exercise levels are readable by everyone"
  on public.exercise_levels for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert exercise levels" on public.exercise_levels;
create policy "Admins can insert exercise levels"
  on public.exercise_levels for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update exercise levels" on public.exercise_levels;
create policy "Admins can update exercise levels"
  on public.exercise_levels for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete exercise levels" on public.exercise_levels;
create policy "Admins can delete exercise levels"
  on public.exercise_levels for delete
  to authenticated
  using (public.is_admin());

alter table public.exercises
  add column if not exists exercise_level_id uuid references public.exercise_levels (id) on delete set null;

create index if not exists exercises_exercise_level_id_idx on public.exercises (exercise_level_id);

insert into public.exercise_levels (slug, name, sort_order) values
  ('rookie-starter', 'Rookie / Starter', 10),
  ('intermediate', 'Intermediate', 20),
  ('advanced', 'Advanced', 30),
  ('elite', 'Elite', 40)
on conflict (slug) do nothing;
