-- Public asset buckets for exercises, equipment images, and program media (covers, promo video)
-- URLs stored in DB columns should be either full public URLs or paths relative to the bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'exercises',
    'exercises',
    true,
    524288000,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]::text[]
  ),
  (
    'equipment',
    'equipment',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'programs',
    'programs',
    true,
    524288000,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]::text[]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Read: anyone (anon + authenticated) can fetch public bucket objects
create policy "Public read exercises bucket"
  on storage.objects for select
  using (bucket_id = 'exercises');

create policy "Public read equipment bucket"
  on storage.objects for select
  using (bucket_id = 'equipment');

create policy "Public read programs bucket"
  on storage.objects for select
  using (bucket_id = 'programs');

-- Write: superseded in 20260324250000_storage_and_admin_roles.sql (admins only).
create policy "Authenticated upload exercises bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'exercises');

create policy "Authenticated update exercises bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'exercises')
  with check (bucket_id = 'exercises');

create policy "Authenticated delete exercises bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'exercises');

create policy "Authenticated upload equipment bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'equipment');

create policy "Authenticated update equipment bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'equipment')
  with check (bucket_id = 'equipment');

create policy "Authenticated delete equipment bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'equipment');

create policy "Authenticated upload programs bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'programs');

create policy "Authenticated update programs bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'programs')
  with check (bucket_id = 'programs');

create policy "Authenticated delete programs bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'programs');
