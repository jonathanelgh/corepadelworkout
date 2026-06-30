-- Program format (training plan vs single workout) and explicit week structure.

do $$ begin
  create type public.program_format as enum ('training_plan', 'single_workout');
exception
  when duplicate_object then null;
end $$;

alter table public.programs
  add column if not exists program_format public.program_format not null default 'training_plan';

comment on column public.programs.program_format is 'training_plan = multi-week schedule; single_workout = one-off routine (e.g. warm-up).';

-- ---------------------------------------------------------------------------

create table if not exists public.program_weeks (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.program_location_tracks (id) on delete cascade,
  week_number integer not null,
  name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_weeks_track_week_number_key unique (track_id, week_number),
  constraint program_weeks_week_number_positive check (week_number >= 1)
);

comment on table public.program_weeks is 'Calendar weeks within a location track; sessions (days) belong to a week.';

create index if not exists program_weeks_track_id_sort_idx
  on public.program_weeks (track_id, sort_order);

create trigger program_weeks_set_updated_at
  before update on public.program_weeks
  for each row
  execute function public.set_row_updated_at();

alter table public.program_weeks enable row level security;

create policy "Program weeks readable with program"
  on public.program_weeks for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.program_location_tracks plt
      join public.programs p on p.id = plt.program_id
      where plt.id = program_weeks.track_id
        and (p.status = 'published' or auth.uid() is not null)
    )
  );

create policy "Admins can insert program weeks"
  on public.program_weeks for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update program weeks"
  on public.program_weeks for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete program weeks"
  on public.program_weeks for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------

alter table public.program_sessions
  add column if not exists week_id uuid references public.program_weeks (id) on delete set null;

create index if not exists program_sessions_week_id_sort_idx
  on public.program_sessions (week_id, sort_order);

-- Mark obvious single-session routines (warm-ups, etc.)
update public.programs p
set
  program_format = 'single_workout',
  duration_weeks = null,
  sessions_per_week = null
where p.program_format = 'training_plan'
  and (
    select count(*)
    from public.program_location_tracks plt
    join public.program_sessions ps on ps.track_id = plt.id
    where plt.program_id = p.id
  ) = 1
  and (p.duration_weeks is null or p.duration_weeks <= 1);

-- Backfill program_weeks for training plans
do $$
declare
  v_track record;
  v_session record;
  v_week_id uuid;
  v_per_week integer;
  v_week_num integer;
  v_day_in_week integer;
begin
  for v_track in
    select plt.id as track_id, p.sessions_per_week
    from public.program_location_tracks plt
    join public.programs p on p.id = plt.program_id
    where p.program_format = 'training_plan'
  loop
    v_per_week := greatest(1, coalesce(nullif(v_track.sessions_per_week, 0), 1));
    v_week_num := 0;
    v_day_in_week := 0;
    v_week_id := null;

    for v_session in
      select ps.id
      from public.program_sessions ps
      where ps.track_id = v_track.track_id
      order by ps.sort_order, ps.created_at
    loop
      if v_day_in_week = 0 then
        v_week_num := v_week_num + 1;
        insert into public.program_weeks (track_id, week_number, name, sort_order)
        values (v_track.track_id, v_week_num, 'Week ' || v_week_num, v_week_num - 1)
        on conflict (track_id, week_number) do update set name = excluded.name
        returning id into v_week_id;
      end if;

      update public.program_sessions
      set week_id = v_week_id
      where id = v_session.id;

      v_day_in_week := v_day_in_week + 1;
      if v_day_in_week >= v_per_week then
        v_day_in_week := 0;
      end if;
    end loop;
  end loop;
end $$;
