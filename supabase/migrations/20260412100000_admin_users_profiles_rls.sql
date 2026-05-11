-- Let admins list all customer profiles and admin flags from the dashboard (Supabase client + RLS).

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read all admin_users rows" on public.admin_users;
create policy "Admins read all admin_users rows"
  on public.admin_users
  for select
  to authenticated
  using (public.is_admin());
