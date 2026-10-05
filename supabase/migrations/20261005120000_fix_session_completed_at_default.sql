-- Starting a training day must not mark it completed.
-- completed_at kept a DEFAULT now() after it became nullable, so Start inserts looked finished.

alter table public.program_session_completions
  alter column completed_at drop default;

-- Rows where Start auto-filled completed_at (started and "completed" within 2 seconds).
update public.program_session_completions
set completed_at = null
where started_at is not null
  and completed_at is not null
  and abs(extract(epoch from (completed_at - started_at))) < 2;

comment on column public.program_session_completions.completed_at is
  'When the member finished every exercise in this training day. Null while in progress.';
