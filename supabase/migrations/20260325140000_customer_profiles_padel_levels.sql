-- Customer profiles (1:1 with auth.users) + reference padel levels + avatar storage.

create type public.user_gender as enum ('male', 'female', 'other');

comment on type public.user_gender is 'Customer-reported gender.';

-- ---------------------------------------------------------------------------
-- Padel levels (reference data; admins manage, everyone reads)
-- ---------------------------------------------------------------------------

create table public.padel_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint padel_levels_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.padel_levels is 'Padel skill levels for customer profiles (padel_level_id on public.profiles).';

create unique index padel_levels_slug_key on public.padel_levels (slug);
create index padel_levels_sort_order_idx on public.padel_levels (sort_order);

create trigger padel_levels_set_updated_at
  before update on public.padel_levels
  for each row
  execute function public.set_row_updated_at();

alter table public.padel_levels enable row level security;

create policy "Padel levels are readable by everyone"
  on public.padel_levels
  for select
  to anon, authenticated
  using (true);

create policy "Admins insert padel levels"
  on public.padel_levels
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update padel levels"
  on public.padel_levels
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete padel levels"
  on public.padel_levels
  for delete
  to authenticated
  using (public.is_admin());

insert into public.padel_levels (name, slug, description, sort_order)
values
  ('Beginner', 'padel-beginner', 'New to padel or occasional play', 10),
  ('Intermediate', 'padel-intermediate', 'Club play with consistent technique', 20),
  ('Advanced', 'padel-advanced', 'Competitive / tournament level', 30),
  ('Pro', 'padel-pro', 'Professional or elite amateur', 40)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  birth_date date,
  profile_image_url text,
  email text,
  gender public.user_gender,
  padel_level_id uuid references public.padel_levels (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Customer profile; id matches auth.users.id.';
comment on column public.profiles.full_name is 'Display name.';
comment on column public.profiles.profile_image_url is 'Public URL (e.g. avatars bucket).';
comment on column public.profiles.email is 'Mirror of signup email; kept for convenient reads under profiles RLS.';

create index profiles_padel_level_id_idx on public.profiles (padel_level_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_row_updated_at();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- New user → profile row (email from auth)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Creates public.profiles when auth.users row is inserted.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Avatars bucket: each user uploads only under folder named with their user id
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read avatars bucket"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "Users upload to own avatar folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatar objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own avatar objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Existing auth users (signed up before this migration) need a one-time backfill, e.g. in SQL editor:
-- insert into public.profiles (id, email)
-- select id, email from auth.users
-- on conflict (id) do nothing;
