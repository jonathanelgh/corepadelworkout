-- Programs can belong to multiple categories (many-to-many via program_categories).

create table public.program_categories (
  program_id uuid not null references public.programs (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (program_id, category_id)
);

comment on table public.program_categories is 'Links programs to one or more categories.';

create index program_categories_category_id_idx on public.program_categories (category_id);

-- Migrate existing single category_id on programs into junction rows.
insert into public.program_categories (program_id, category_id, sort_order)
select id, category_id, 0
from public.programs
where category_id is not null;

drop index if exists public.programs_category_id_idx;

alter table public.programs drop column if exists category_id;

alter table public.program_categories enable row level security;

create policy "Program categories readable with program"
  on public.program_categories for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.programs p
      where p.id = program_categories.program_id
        and (p.status = 'published' or auth.uid() is not null)
    )
  );

create policy "Admins can insert program categories"
  on public.program_categories for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update program categories"
  on public.program_categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete program categories"
  on public.program_categories for delete
  to authenticated
  using (public.is_admin());
