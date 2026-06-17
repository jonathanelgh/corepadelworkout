-- Whether an exercise should be performed on both sides of the body (e.g. each leg).

alter table public.exercises
  add column if not exists both_sides boolean not null default false;

comment on column public.exercises.both_sides is
  'When true, members should perform the exercise on both sides of the body.';
