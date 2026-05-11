-- Waitlist for pre-launch landing: anonymous inserts only, no public reads.

create table if not exists public.pre_launch_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint pre_launch_signups_email_unique unique (email)
);

create index if not exists pre_launch_signups_created_at_idx on public.pre_launch_signups (created_at desc);

alter table public.pre_launch_signups enable row level security;

create policy "pre_launch_signups_insert_public"
  on public.pre_launch_signups
  for insert
  to anon, authenticated
  with check (
    length(trim(email)) > 3
    and position('@' in trim(email)) > 1
  );

comment on table public.pre_launch_signups is 'Pre-launch waitlist from marketing homepage; email lowercased in app.';
