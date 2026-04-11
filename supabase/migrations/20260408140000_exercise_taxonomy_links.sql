-- Many-to-many: exercises ↔ exercise_category_types, movement_patterns, body_regions.
-- Lookup tables may already exist in production; CREATE IF NOT EXISTS keeps fresh envs in sync.

create table if not exists public.exercise_category_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint exercise_category_types_slug_key unique (slug)
);

comment on table public.exercise_category_types is 'Taxonomy: exercise category types (e.g. strength, mobility).';

create table if not exists public.movement_patterns (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint movement_patterns_slug_key unique (slug)
);

comment on table public.movement_patterns is 'Taxonomy: movement patterns (e.g. hinge, push).';

create table if not exists public.body_regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint body_regions_slug_key unique (slug)
);

comment on table public.body_regions is 'Taxonomy: body regions targeted (e.g. shoulder, core).';

alter table public.exercise_category_types enable row level security;
alter table public.movement_patterns enable row level security;
alter table public.body_regions enable row level security;

drop policy if exists "Exercise category types are readable by everyone" on public.exercise_category_types;
create policy "Exercise category types are readable by everyone"
  on public.exercise_category_types for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert exercise category types" on public.exercise_category_types;
create policy "Admins can insert exercise category types"
  on public.exercise_category_types for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update exercise category types" on public.exercise_category_types;
create policy "Admins can update exercise category types"
  on public.exercise_category_types for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete exercise category types" on public.exercise_category_types;
create policy "Admins can delete exercise category types"
  on public.exercise_category_types for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Movement patterns are readable by everyone" on public.movement_patterns;
create policy "Movement patterns are readable by everyone"
  on public.movement_patterns for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert movement patterns" on public.movement_patterns;
create policy "Admins can insert movement patterns"
  on public.movement_patterns for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update movement patterns" on public.movement_patterns;
create policy "Admins can update movement patterns"
  on public.movement_patterns for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete movement patterns" on public.movement_patterns;
create policy "Admins can delete movement patterns"
  on public.movement_patterns for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Body regions are readable by everyone" on public.body_regions;
create policy "Body regions are readable by everyone"
  on public.body_regions for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert body regions" on public.body_regions;
create policy "Admins can insert body regions"
  on public.body_regions for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update body regions" on public.body_regions;
create policy "Admins can update body regions"
  on public.body_regions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete body regions" on public.body_regions;
create policy "Admins can delete body regions"
  on public.body_regions for delete
  to authenticated
  using (public.is_admin());

create table if not exists public.exercise_category_type_links (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  exercise_category_type_id uuid not null references public.exercise_category_types (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, exercise_category_type_id)
);

comment on table public.exercise_category_type_links is 'Many-to-many: exercises can have multiple category types.';

create index if not exists exercise_category_type_links_type_id_idx
  on public.exercise_category_type_links (exercise_category_type_id);

create table if not exists public.exercise_movement_pattern_links (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  movement_pattern_id uuid not null references public.movement_patterns (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, movement_pattern_id)
);

comment on table public.exercise_movement_pattern_links is 'Many-to-many: exercises can have multiple movement patterns.';

create index if not exists exercise_movement_pattern_links_pattern_id_idx
  on public.exercise_movement_pattern_links (movement_pattern_id);

create table if not exists public.exercise_body_region_links (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  body_region_id uuid not null references public.body_regions (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, body_region_id)
);

comment on table public.exercise_body_region_links is 'Many-to-many: exercises can target multiple body regions.';

create index if not exists exercise_body_region_links_region_id_idx
  on public.exercise_body_region_links (body_region_id);

alter table public.exercise_category_type_links enable row level security;
alter table public.exercise_movement_pattern_links enable row level security;
alter table public.exercise_body_region_links enable row level security;

drop policy if exists "Exercise category type links are readable by everyone" on public.exercise_category_type_links;
create policy "Exercise category type links are readable by everyone"
  on public.exercise_category_type_links for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert exercise category type links" on public.exercise_category_type_links;
create policy "Admins can insert exercise category type links"
  on public.exercise_category_type_links for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update exercise category type links" on public.exercise_category_type_links;
create policy "Admins can update exercise category type links"
  on public.exercise_category_type_links for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete exercise category type links" on public.exercise_category_type_links;
create policy "Admins can delete exercise category type links"
  on public.exercise_category_type_links for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Exercise movement pattern links are readable by everyone" on public.exercise_movement_pattern_links;
create policy "Exercise movement pattern links are readable by everyone"
  on public.exercise_movement_pattern_links for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert exercise movement pattern links" on public.exercise_movement_pattern_links;
create policy "Admins can insert exercise movement pattern links"
  on public.exercise_movement_pattern_links for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update exercise movement pattern links" on public.exercise_movement_pattern_links;
create policy "Admins can update exercise movement pattern links"
  on public.exercise_movement_pattern_links for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete exercise movement pattern links" on public.exercise_movement_pattern_links;
create policy "Admins can delete exercise movement pattern links"
  on public.exercise_movement_pattern_links for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Exercise body region links are readable by everyone" on public.exercise_body_region_links;
create policy "Exercise body region links are readable by everyone"
  on public.exercise_body_region_links for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert exercise body region links" on public.exercise_body_region_links;
create policy "Admins can insert exercise body region links"
  on public.exercise_body_region_links for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update exercise body region links" on public.exercise_body_region_links;
create policy "Admins can update exercise body region links"
  on public.exercise_body_region_links for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete exercise body region links" on public.exercise_body_region_links;
create policy "Admins can delete exercise body region links"
  on public.exercise_body_region_links for delete
  to authenticated
  using (public.is_admin());
