-- Program categories (admin-managed taxonomy, readable on storefront)
-- Apply: Supabase Dashboard → SQL Editor, or `supabase db push` if using CLI

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.categories is 'Categories for programs; attach via public.program_categories (many-to-many).';

create unique index categories_slug_key on public.categories (slug);
create index categories_sort_order_idx on public.categories (sort_order);

-- Keep updated_at in sync
create or replace function public.set_categories_updated_at()
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

create trigger categories_set_updated_at
  before update on public.categories
  for each row
  execute function public.set_categories_updated_at();

alter table public.categories enable row level security;

-- Anyone can read categories (filters, public program pages)
create policy "Categories are readable by everyone"
  on public.categories
  for select
  to anon, authenticated
  using (true);

-- Authenticated users can manage rows (tighten to admin-only when you add profiles.role)
create policy "Authenticated users can insert categories"
  on public.categories
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update categories"
  on public.categories
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete categories"
  on public.categories
  for delete
  to authenticated
  using (true);

-- Seed defaults (safe to re-run)
insert into public.categories (name, slug, description, sort_order)
values
  ('Strength', 'strength', 'Power and resistance work for padel', 10),
  ('Recovery', 'recovery', 'Rehab and mobility', 20),
  ('Footwork', 'footwork', 'Court movement and agility', 30),
  ('Fundamentals', 'fundamentals', 'Basics for every level', 40)
on conflict (slug) do nothing;
