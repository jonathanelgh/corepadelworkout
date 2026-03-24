-- Programs can offer different session/exercise curricula per training location (gym vs home, etc.).

create table public.program_location_tracks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, location_id)
);

comment on table public.program_location_tracks is 'One row per (program, location): sessions and exercises hang off the track.';

create index program_location_tracks_program_id_sort_idx
  on public.program_location_tracks (program_id, sort_order);

create trigger program_location_tracks_set_updated_at
  before update on public.program_location_tracks
  for each row
  execute function public.set_row_updated_at();

alter table public.program_location_tracks enable row level security;

create policy "Program location tracks readable with program"
  on public.program_location_tracks for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_location_tracks.program_id
        and (p.status = 'published' or auth.uid() is not null)
    )
  );

create policy "Admins can insert program location tracks"
  on public.program_location_tracks for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update program location tracks"
  on public.program_location_tracks for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete program location tracks"
  on public.program_location_tracks for delete
  to authenticated
  using (public.is_admin());

-- One default track per program that already has sessions (first location by sort_order)
insert into public.program_location_tracks (program_id, location_id, sort_order)
select d.program_id, l.id, 0
from (select distinct program_id from public.program_sessions) d
cross join lateral (
  select id from public.locations order by sort_order asc, id asc limit 1
) l;

alter table public.program_sessions
  add column track_id uuid references public.program_location_tracks (id) on delete cascade;

update public.program_sessions ps
set track_id = t.id
from public.program_location_tracks t
where t.program_id = ps.program_id;

alter table public.program_sessions alter column track_id set not null;

-- Policies on program_exercises may reference program_sessions.program_id; remove before dropping column
drop policy if exists "Program exercises readable with program" on public.program_exercises;
drop policy if exists "Admins can insert program exercises" on public.program_exercises;
drop policy if exists "Admins can update program exercises" on public.program_exercises;
drop policy if exists "Admins can delete program exercises" on public.program_exercises;

drop policy if exists "Program sessions readable with program" on public.program_sessions;
drop policy if exists "Admins can insert program sessions" on public.program_sessions;
drop policy if exists "Admins can update program sessions" on public.program_sessions;
drop policy if exists "Admins can delete program sessions" on public.program_sessions;

alter table public.program_sessions drop constraint if exists program_sessions_program_id_fkey;

drop index if exists program_sessions_program_id_sort_idx;

alter table public.program_sessions drop column program_id;

create index program_sessions_track_id_sort_idx on public.program_sessions (track_id, sort_order);

create policy "Program sessions readable with program"
  on public.program_sessions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.program_location_tracks plt
      join public.programs p on p.id = plt.program_id
      where plt.id = program_sessions.track_id
        and (p.status = 'published' or auth.uid() is not null)
    )
  );

create policy "Admins can insert program sessions"
  on public.program_sessions for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update program sessions"
  on public.program_sessions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete program sessions"
  on public.program_sessions for delete
  to authenticated
  using (public.is_admin());

create policy "Program exercises readable with program"
  on public.program_exercises for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.program_sessions ps
      join public.program_location_tracks plt on plt.id = ps.track_id
      join public.programs p on p.id = plt.program_id
      where ps.id = program_exercises.session_id
        and (p.status = 'published' or auth.uid() is not null)
    )
  );

create policy "Admins can insert program exercises"
  on public.program_exercises for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update program exercises"
  on public.program_exercises for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete program exercises"
  on public.program_exercises for delete
  to authenticated
  using (public.is_admin());
