-- Who may upload to public asset buckets: admins only (see storage policies below).

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is 'Users allowed to upload to storage buckets and use admin APIs. Add rows via SQL Editor or service role.';

alter table public.admin_users enable row level security;

-- Users can only read their own row (for UI: "am I admin?")
create policy "Users can read own admin row"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Used in storage RLS; must bypass RLS on admin_users when checking membership
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is 'True when current user is listed in public.admin_users.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

-- Replace storage write policies: authenticated + admin only
drop policy if exists "Authenticated upload exercises bucket" on storage.objects;
drop policy if exists "Authenticated update exercises bucket" on storage.objects;
drop policy if exists "Authenticated delete exercises bucket" on storage.objects;
drop policy if exists "Authenticated upload equipment bucket" on storage.objects;
drop policy if exists "Authenticated update equipment bucket" on storage.objects;
drop policy if exists "Authenticated delete equipment bucket" on storage.objects;
drop policy if exists "Authenticated upload programs bucket" on storage.objects;
drop policy if exists "Authenticated update programs bucket" on storage.objects;
drop policy if exists "Authenticated delete programs bucket" on storage.objects;

create policy "Admins upload exercises bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'exercises' and public.is_admin());

create policy "Admins update exercises bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'exercises' and public.is_admin())
  with check (bucket_id = 'exercises' and public.is_admin());

create policy "Admins delete exercises bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'exercises' and public.is_admin());

create policy "Admins upload equipment bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'equipment' and public.is_admin());

create policy "Admins update equipment bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'equipment' and public.is_admin())
  with check (bucket_id = 'equipment' and public.is_admin());

create policy "Admins delete equipment bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'equipment' and public.is_admin());

create policy "Admins upload programs bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'programs' and public.is_admin());

create policy "Admins update programs bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'programs' and public.is_admin())
  with check (bucket_id = 'programs' and public.is_admin());

create policy "Admins delete programs bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'programs' and public.is_admin());
