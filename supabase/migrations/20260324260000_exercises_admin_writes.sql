-- Admin panel: only users in public.admin_users may mutate exercises (matches storage RLS).

drop policy if exists "Authenticated users can insert exercises" on public.exercises;
drop policy if exists "Authenticated users can update exercises" on public.exercises;
drop policy if exists "Authenticated users can delete exercises" on public.exercises;

create policy "Admins can insert exercises"
  on public.exercises for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update exercises"
  on public.exercises for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete exercises"
  on public.exercises for delete
  to authenticated
  using (public.is_admin());
