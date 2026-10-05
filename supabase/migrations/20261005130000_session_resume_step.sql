-- Persist which playback step a member was on so Continue can resume mid-day.

alter table public.program_session_completions
  add column if not exists resume_step_index integer not null default 0
    check (resume_step_index >= 0);

comment on column public.program_session_completions.resume_step_index is
  '0-based workout playback step index to resume when the day is in progress.';
