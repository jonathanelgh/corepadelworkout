-- Named sessions (e.g. "Day 1: Upper body") group exercises within a program.

create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  name text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.program_sessions is 'Named days/sessions inside a program; exercises belong to a session.';

create index program_sessions_program_id_sort_idx on public.program_sessions (program_id, sort_order);

create trigger program_sessions_set_updated_at
  before update on public.program_sessions
  for each row
  execute function public.set_row_updated_at();

alter table public.program_sessions enable row level security;

create policy "Program sessions readable with program"
  on public.program_sessions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_sessions.program_id
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

-- Backfill: one session per program that already has exercises
insert into public.program_sessions (program_id, name, sort_order)
select distinct on (program_id)
  program_id,
  'Day 1',
  0
from public.program_exercises
order by program_id;

alter table public.program_exercises add column session_id uuid references public.program_sessions (id) on delete cascade;

update public.program_exercises pe
set session_id = ps.id
from public.program_sessions ps
where ps.program_id = pe.program_id;

alter table public.program_exercises alter column session_id set not null;

-- Replace policies that reference program_exercises.program_id
drop policy if exists "Program exercises readable with program" on public.program_exercises;
drop policy if exists "Admins can insert program exercises" on public.program_exercises;
drop policy if exists "Admins can update program exercises" on public.program_exercises;
drop policy if exists "Admins can delete program exercises" on public.program_exercises;

alter table public.program_exercises drop constraint if exists program_exercises_program_id_fkey;
alter table public.program_exercises drop constraint if exists program_exercises_program_id_exercise_id_key;

drop index if exists program_exercises_program_id_idx;

alter table public.program_exercises drop column program_id;

alter table public.program_exercises
  add constraint program_exercises_session_id_exercise_id_key unique (session_id, exercise_id);

create index program_exercises_session_id_sort_idx on public.program_exercises (session_id, sort_order);

create policy "Program exercises readable with program"
  on public.program_exercises for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.program_sessions ps
      join public.programs p on p.id = ps.program_id
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
