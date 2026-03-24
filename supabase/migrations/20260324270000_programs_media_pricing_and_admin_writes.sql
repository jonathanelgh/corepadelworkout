-- Extra storefront fields + admin-only writes (aligned with exercises + storage).

alter table public.programs
  add column if not exists body text,
  add column if not exists cover_image_url text,
  add column if not exists promo_video_url text,
  add column if not exists price numeric(10, 2),
  add column if not exists compare_at_price numeric(10, 2);

comment on column public.programs.body is 'Long-form / sales description (card copy stays in description).';

drop policy if exists "Authenticated users can insert programs" on public.programs;
drop policy if exists "Authenticated users can update programs" on public.programs;
drop policy if exists "Authenticated users can delete programs" on public.programs;

create policy "Admins can insert programs"
  on public.programs for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update programs"
  on public.programs for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete programs"
  on public.programs for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Authenticated users can insert program exercises" on public.program_exercises;
drop policy if exists "Authenticated users can update program exercises" on public.program_exercises;
drop policy if exists "Authenticated users can delete program exercises" on public.program_exercises;

create policy "Admins can insert program exercises"
  on public.program_exercises for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update program exercises"
  on public.program_exercises for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete program exercises"
  on public.program_exercises for delete
  to authenticated
  using (public.is_admin());
