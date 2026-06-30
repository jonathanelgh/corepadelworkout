-- Track when a member starts a training day, not only when they finish.

alter table public.program_session_completions
  add column if not exists started_at timestamptz;

alter table public.program_session_completions
  alter column completed_at drop not null;

comment on column public.program_session_completions.started_at is
  'When the member began this training day (workout player started).';

create index if not exists program_session_completions_user_program_started_idx
  on public.program_session_completions (user_id, program_id, started_at desc nulls last);
