-- RPE + intensity per exercise slot (AI coach output)
alter table public.program_exercises
  add column if not exists rpe text;

comment on column public.program_exercises.rpe is
  'Rate of Perceived Exertion for this exercise slot (AI coach output).';

alter table public.program_exercises
  add column if not exists intensity text;

comment on column public.program_exercises.intensity is
  'Intensity/load recommendation for this exercise slot (AI coach output).';

