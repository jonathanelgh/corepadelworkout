-- Exercises can belong to multiple locations (gym, home, court, etc.).

create table public.exercise_locations (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (exercise_id, location_id)
);

comment on table public.exercise_locations is 'Locations where an exercise can be performed (many-to-many).';

create index exercise_locations_location_id_idx on public.exercise_locations (location_id);

insert into public.exercise_locations (exercise_id, location_id, sort_order)
select id, location_id, 0
from public.exercises
where location_id is not null
on conflict (exercise_id, location_id) do nothing;

alter table public.exercise_locations enable row level security;

create policy "Exercise locations are readable by everyone"
  on public.exercise_locations for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert exercise locations"
  on public.exercise_locations for insert to authenticated with check (true);

create policy "Authenticated users can update exercise locations"
  on public.exercise_locations for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete exercise locations"
  on public.exercise_locations for delete to authenticated using (true);
