-- Athlete-logged loads: last weight per exercise + per-session history.

create table public.member_exercise_loads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  weight_value numeric not null check (weight_value > 0),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  updated_at timestamptz not null default now(),
  constraint member_exercise_loads_user_exercise_key unique (user_id, exercise_id)
);

comment on table public.member_exercise_loads is
  'Last logged weight per member + catalog exercise (prefills next workout).';

create index member_exercise_loads_user_id_idx
  on public.member_exercise_loads (user_id, updated_at desc);

create trigger member_exercise_loads_set_updated_at
  before update on public.member_exercise_loads
  for each row
  execute function public.set_row_updated_at();

alter table public.member_exercise_loads enable row level security;

create policy "Users read own exercise loads"
  on public.member_exercise_loads for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own exercise loads"
  on public.member_exercise_loads for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own exercise loads"
  on public.member_exercise_loads for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own exercise loads"
  on public.member_exercise_loads for delete to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all exercise loads"
  on public.member_exercise_loads for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------

create table public.member_session_exercise_loads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  session_id uuid not null references public.program_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  program_exercise_id uuid references public.program_exercises (id) on delete set null,
  weight_value numeric not null check (weight_value > 0),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  logged_at timestamptz not null default now(),
  constraint member_session_exercise_loads_uniq unique (user_id, session_id, exercise_id)
);

comment on table public.member_session_exercise_loads is
  'Weight logged for a catalog exercise within a specific program session.';

create index member_session_exercise_loads_user_session_idx
  on public.member_session_exercise_loads (user_id, session_id, logged_at desc);

alter table public.member_session_exercise_loads enable row level security;

create policy "Users read own session exercise loads"
  on public.member_session_exercise_loads for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own session exercise loads"
  on public.member_session_exercise_loads for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own session exercise loads"
  on public.member_session_exercise_loads for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own session exercise loads"
  on public.member_session_exercise_loads for delete to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all session exercise loads"
  on public.member_session_exercise_loads for select to authenticated
  using (public.is_admin());
