-- Body parts: finer-grained anatomy tags (distinct from body_regions: upper/lower/core/full).

create table if not exists public.body_parts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint body_parts_slug_key unique (slug)
);

comment on table public.body_parts is 'Taxonomy: specific body parts (e.g. knee, shoulder).';

alter table public.body_parts enable row level security;

drop policy if exists "Body parts are readable by everyone" on public.body_parts;
create policy "Body parts are readable by everyone"
  on public.body_parts for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert body parts" on public.body_parts;
create policy "Admins can insert body parts"
  on public.body_parts for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update body parts" on public.body_parts;
create policy "Admins can update body parts"
  on public.body_parts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete body parts" on public.body_parts;
create policy "Admins can delete body parts"
  on public.body_parts for delete
  to authenticated
  using (public.is_admin());

create table if not exists public.exercise_body_part_links (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  body_part_id uuid not null references public.body_parts (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, body_part_id)
);

comment on table public.exercise_body_part_links is 'Many-to-many: exercises can tag multiple body parts.';

create index if not exists exercise_body_part_links_body_part_id_idx
  on public.exercise_body_part_links (body_part_id);

alter table public.exercise_body_part_links enable row level security;

drop policy if exists "Exercise body part links are readable by everyone" on public.exercise_body_part_links;
create policy "Exercise body part links are readable by everyone"
  on public.exercise_body_part_links for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert exercise body part links" on public.exercise_body_part_links;
create policy "Admins can insert exercise body part links"
  on public.exercise_body_part_links for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update exercise body part links" on public.exercise_body_part_links;
create policy "Admins can update exercise body part links"
  on public.exercise_body_part_links for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete exercise body part links" on public.exercise_body_part_links;
create policy "Admins can delete exercise body part links"
  on public.exercise_body_part_links for delete
  to authenticated
  using (public.is_admin());

insert into public.body_parts (slug, name) values
  ('ankle', 'Ankle'),
  ('knee', 'Knee'),
  ('hip', 'Hip'),
  ('abdomen', 'Abdomen'),
  ('chest', 'Chest'),
  ('shoulder', 'Shoulder'),
  ('neck', 'Neck'),
  ('upper-back', 'Upper back'),
  ('lower-back', 'Lower back'),
  ('elbow', 'Elbow'),
  ('wrist', 'Wrist')
on conflict (slug) do nothing;
