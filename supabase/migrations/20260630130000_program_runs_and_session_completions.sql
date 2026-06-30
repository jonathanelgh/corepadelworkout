-- Track started programs and completed training days (sessions).

create table public.program_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  track_id uuid not null references public.program_location_tracks (id) on delete cascade,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_runs_user_program_key unique (user_id, program_id)
);

comment on table public.program_runs is 'Active program follow-through per member (one row per user per program).';

create index program_runs_user_id_idx on public.program_runs (user_id, updated_at desc);

create trigger program_runs_set_updated_at
  before update on public.program_runs
  for each row
  execute function public.set_row_updated_at();

alter table public.program_runs enable row level security;

create policy "Users read own program runs"
  on public.program_runs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own program runs"
  on public.program_runs for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own program runs"
  on public.program_runs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins read all program runs"
  on public.program_runs for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------

create table public.program_session_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  session_id uuid not null references public.program_sessions (id) on delete cascade,
  completed_at timestamptz not null default now(),
  constraint program_session_completions_user_session_key unique (user_id, session_id)
);

comment on table public.program_session_completions is 'One row when a member finishes a program day (session).';

create index program_session_completions_user_program_idx
  on public.program_session_completions (user_id, program_id, completed_at desc);

alter table public.program_session_completions enable row level security;

create policy "Users read own session completions"
  on public.program_session_completions for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own session completions"
  on public.program_session_completions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own session completions"
  on public.program_session_completions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins read all session completions"
  on public.program_session_completions for select to authenticated
  using (public.is_admin());
