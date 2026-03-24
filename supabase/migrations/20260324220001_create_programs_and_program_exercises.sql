-- Part 2: programs + program_exercises (reuse exercises across programs)

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  difficulty_level_id uuid references public.difficulty_levels (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.programs is 'Workout programs composed of ordered exercises.';

create unique index programs_slug_key on public.programs (slug);
create index programs_category_id_idx on public.programs (category_id);
create index programs_status_idx on public.programs (status);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (program_id, exercise_id)
);

comment on table public.program_exercises is 'Ordered exercises inside a program.';

create index program_exercises_program_id_idx on public.program_exercises (program_id, sort_order);
create index program_exercises_exercise_id_idx on public.program_exercises (exercise_id);

create trigger programs_set_updated_at
  before update on public.programs
  for each row
  execute function public.set_row_updated_at();

alter table public.programs enable row level security;
alter table public.program_exercises enable row level security;

create policy "Published programs are readable by everyone"
  on public.programs for select
  to anon, authenticated
  using (status = 'published' or auth.uid() is not null);

create policy "Authenticated users can insert programs"
  on public.programs for insert to authenticated with check (true);

create policy "Authenticated users can update programs"
  on public.programs for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete programs"
  on public.programs for delete to authenticated using (true);

create policy "Program exercises readable with program"
  on public.program_exercises for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_exercises.program_id
        and (p.status = 'published' or auth.uid() is not null)
    )
  );

create policy "Authenticated users can insert program exercises"
  on public.program_exercises for insert to authenticated with check (true);

create policy "Authenticated users can update program exercises"
  on public.program_exercises for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete program exercises"
  on public.program_exercises for delete to authenticated using (true);
