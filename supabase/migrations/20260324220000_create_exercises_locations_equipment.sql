-- Part 1: locations, equipment, exercises, exercise_equipment junction

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.locations is 'Where exercises are performed (e.g. gym, home, court).';

create unique index locations_slug_key on public.locations (slug);
create index locations_sort_order_idx on public.locations (sort_order);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.equipment is 'Equipment that can be attached to many exercises.';

create index equipment_title_idx on public.equipment (title);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  how_to text,
  video_url text,
  image_url text,
  location_id uuid not null references public.locations (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.exercises.how_to is 'Step-by-step instructions.';
comment on column public.exercises.video_url is 'Video URL or storage path.';
comment on column public.exercises.image_url is 'Image URL or storage path.';
comment on table public.exercises is 'Reusable exercise library; link to programs via program_exercises.';

create index exercises_location_id_idx on public.exercises (location_id);
create index exercises_title_idx on public.exercises (title);

create table public.exercise_equipment (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, equipment_id)
);

comment on table public.exercise_equipment is 'Equipment for an exercise (many-to-many).';

create index exercise_equipment_equipment_id_idx on public.exercise_equipment (equipment_id);

create or replace function public.set_row_updated_at()
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

create trigger locations_set_updated_at
  before update on public.locations
  for each row
  execute function public.set_row_updated_at();

create trigger equipment_set_updated_at
  before update on public.equipment
  for each row
  execute function public.set_row_updated_at();

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row
  execute function public.set_row_updated_at();

alter table public.locations enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_equipment enable row level security;

create policy "Locations are readable by everyone"
  on public.locations for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert locations"
  on public.locations for insert to authenticated with check (true);

create policy "Authenticated users can update locations"
  on public.locations for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete locations"
  on public.locations for delete to authenticated using (true);

create policy "Equipment is readable by everyone"
  on public.equipment for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert equipment"
  on public.equipment for insert to authenticated with check (true);

create policy "Authenticated users can update equipment"
  on public.equipment for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete equipment"
  on public.equipment for delete to authenticated using (true);

create policy "Exercises are readable by everyone"
  on public.exercises for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert exercises"
  on public.exercises for insert to authenticated with check (true);

create policy "Authenticated users can update exercises"
  on public.exercises for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete exercises"
  on public.exercises for delete to authenticated using (true);

create policy "Exercise equipment is readable by everyone"
  on public.exercise_equipment for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert exercise equipment"
  on public.exercise_equipment for insert to authenticated with check (true);

create policy "Authenticated users can update exercise equipment"
  on public.exercise_equipment for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete exercise equipment"
  on public.exercise_equipment for delete to authenticated using (true);

insert into public.locations (name, slug, sort_order)
values
  ('Gym', 'gym', 10),
  ('Home', 'home', 20),
  ('At the court', 'at-the-court', 30)
on conflict (slug) do nothing;
