-- Bulk exercise import from videos (Gemini analysis + async processing).

create table if not exists public.exercise_bulk_import_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  notify_email text not null,
  default_location_id uuid not null references public.locations (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'partial', 'failed')),
  total_count integer not null default 0,
  completed_count integer not null default 0,
  failed_count integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists exercise_bulk_import_batches_created_by_idx
  on public.exercise_bulk_import_batches (created_by, created_at desc);

comment on table public.exercise_bulk_import_batches is 'Admin bulk upload: one row per multi-video import job.';

create table if not exists public.exercise_bulk_import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.exercise_bulk_import_batches (id) on delete cascade,
  sort_order integer not null default 0,
  original_filename text not null,
  storage_path text not null,
  video_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  exercise_id uuid references public.exercises (id) on delete set null,
  error_message text,
  gemini_raw jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists exercise_bulk_import_items_batch_id_idx
  on public.exercise_bulk_import_items (batch_id, sort_order);

alter table public.exercise_bulk_import_batches enable row level security;
alter table public.exercise_bulk_import_items enable row level security;

create policy "Admins read own bulk import batches"
  on public.exercise_bulk_import_batches for select
  to authenticated
  using (public.is_admin() and created_by = auth.uid());

create policy "Admins read bulk import items for own batches"
  on public.exercise_bulk_import_items for select
  to authenticated
  using (
    public.is_admin()
    and exists (
      select 1 from public.exercise_bulk_import_batches b
      where b.id = batch_id and b.created_by = auth.uid()
    )
  );

create policy "Admins insert own bulk import batches"
  on public.exercise_bulk_import_batches for insert
  to authenticated
  with check (public.is_admin() and created_by = auth.uid());

create policy "Admins insert bulk import items for own batches"
  on public.exercise_bulk_import_items for insert
  to authenticated
  with check (
    public.is_admin()
    and exists (
      select 1 from public.exercise_bulk_import_batches b
      where b.id = batch_id and b.created_by = auth.uid()
    )
  );
