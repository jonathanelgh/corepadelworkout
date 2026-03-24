-- Difficulty levels for programs (admin-managed, readable on storefront)

create table public.difficulty_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint difficulty_levels_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.difficulty_levels is 'Difficulty levels for programs; use difficulty_level_id on programs when you add that column.';

create unique index difficulty_levels_slug_key on public.difficulty_levels (slug);
create index difficulty_levels_sort_order_idx on public.difficulty_levels (sort_order);

create or replace function public.set_difficulty_levels_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger difficulty_levels_set_updated_at
  before update on public.difficulty_levels
  for each row
  execute function public.set_difficulty_levels_updated_at();

alter table public.difficulty_levels enable row level security;

create policy "Difficulty levels are readable by everyone"
  on public.difficulty_levels
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert difficulty levels"
  on public.difficulty_levels
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update difficulty levels"
  on public.difficulty_levels
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete difficulty levels"
  on public.difficulty_levels
  for delete
  to authenticated
  using (true);

insert into public.difficulty_levels (name, slug, description, sort_order)
values
  ('Beginner', 'beginner', 'Foundations and manageable load', 10),
  ('Intermediate', 'intermediate', 'Higher intensity and complexity', 20),
  ('Advanced', 'advanced', 'High demand and sport-specific work', 30),
  ('All Levels', 'all-levels', 'Progressions for mixed abilities', 40)
on conflict (slug) do nothing;
