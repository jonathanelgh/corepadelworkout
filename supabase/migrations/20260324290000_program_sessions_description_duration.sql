-- Session-level copy and planned duration for storefront / player UI.

alter table public.program_sessions
  add column if not exists description text,
  add column if not exists duration_minutes integer;

comment on column public.program_sessions.description is 'Optional notes for this session (focus, intent, equipment).';
comment on column public.program_sessions.duration_minutes is 'Suggested session length in minutes; null if unspecified.';

alter table public.program_sessions
  drop constraint if exists program_sessions_duration_minutes_non_negative;

alter table public.program_sessions
  add constraint program_sessions_duration_minutes_non_negative
  check (duration_minutes is null or duration_minutes >= 0);
