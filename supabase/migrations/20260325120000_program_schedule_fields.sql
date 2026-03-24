-- Program-level schedule summary for cards and storefront (optional).

alter table public.programs
  add column if not exists duration_weeks integer,
  add column if not exists sessions_per_week integer,
  add column if not exists minutes_per_session integer;

comment on column public.programs.duration_weeks is 'Total program length in weeks (e.g. 4 for "4 Weeks").';
comment on column public.programs.sessions_per_week is 'How many sessions per week (e.g. 3 for "3 / week").';
comment on column public.programs.minutes_per_session is 'Typical minutes per session (e.g. 45 for "45 mins").';

alter table public.programs
  drop constraint if exists programs_duration_weeks_non_negative;

alter table public.programs
  add constraint programs_duration_weeks_non_negative
  check (duration_weeks is null or duration_weeks >= 0);

alter table public.programs
  drop constraint if exists programs_sessions_per_week_non_negative;

alter table public.programs
  add constraint programs_sessions_per_week_non_negative
  check (sessions_per_week is null or sessions_per_week >= 0);

alter table public.programs
  drop constraint if exists programs_minutes_per_session_non_negative;

alter table public.programs
  add constraint programs_minutes_per_session_non_negative
  check (minutes_per_session is null or minutes_per_session >= 0);
