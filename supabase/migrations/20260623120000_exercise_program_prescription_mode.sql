-- Restrict how an exercise may be prescribed when placed in a program.

alter table public.exercises
  add column if not exists program_prescription_mode text not null default 'all';

alter table public.exercises
  drop constraint if exists exercises_program_prescription_mode_check;

alter table public.exercises
  add constraint exercises_program_prescription_mode_check
  check (program_prescription_mode in ('all', 'time_only', 'sets_reps_only'));

comment on column public.exercises.program_prescription_mode is
  'Allowed prescription modes in programs: all, time_only (timed work), or sets_reps_only.';
