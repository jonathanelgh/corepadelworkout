-- Optional starting load for an exercise slot (e.g. "12 kg", "yellow band").
alter table public.program_exercises
  add column if not exists load_prescription text;

comment on column public.program_exercises.load_prescription is
  'Suggested external load for this exercise slot; auto-progressed weekly on multi-week AI programs.';
