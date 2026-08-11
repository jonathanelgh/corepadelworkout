-- Restrict program category writes to admins (reads stay public).

drop policy if exists "Authenticated users can insert categories" on public.categories;
drop policy if exists "Authenticated users can update categories" on public.categories;
drop policy if exists "Authenticated users can delete categories" on public.categories;

create policy "Admins can insert categories"
  on public.categories
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update categories"
  on public.categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete categories"
  on public.categories
  for delete
  to authenticated
  using (public.is_admin());
