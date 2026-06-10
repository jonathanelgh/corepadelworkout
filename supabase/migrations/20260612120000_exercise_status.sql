-- Draft vs published exercises (bulk video import creates drafts for admin review).

alter table public.exercises
  add column if not exists status text not null default 'published'
  check (status in ('draft', 'published'));

comment on column public.exercises.status is 'draft = hidden from members until published in admin; published = visible in workouts.';

create index if not exists exercises_status_idx on public.exercises (status);

drop policy if exists "Exercises are readable by everyone" on public.exercises;

create policy "Published exercises are readable by everyone"
  on public.exercises for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

-- Exercises created via bulk video import should stay draft until reviewed.
update public.exercises e
set status = 'draft'
where exists (
  select 1
  from public.exercise_bulk_import_items i
  where i.exercise_id = e.id
    and i.status = 'completed'
);
