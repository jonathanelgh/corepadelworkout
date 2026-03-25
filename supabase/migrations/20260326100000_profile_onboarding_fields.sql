-- Onboarding answers stored on public.profiles (1:1 with auth.users).

alter table public.profiles
  add column if not exists padel_pains text[] not null default '{}',
  add column if not exists primary_goal text,
  add column if not exists training_environment text,
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.padel_pains is 'Selected padel pain slugs: padel_elbow, jumpers_knee, lower_back, plantar_fasciitis, none (exclusive with injuries in app).';
comment on column public.profiles.primary_goal is 'Onboarding priority: power, speed, longevity.';
comment on column public.profiles.training_environment is 'Default training context: gym, home, club.';
comment on column public.profiles.onboarding_completed_at is 'Set when user finishes Core Padel onboarding.';

alter table public.profiles drop constraint if exists profiles_primary_goal_check;
alter table public.profiles
  add constraint profiles_primary_goal_check
  check (primary_goal is null or primary_goal in ('power', 'speed', 'longevity'));

alter table public.profiles drop constraint if exists profiles_training_environment_check;
alter table public.profiles
  add constraint profiles_training_environment_check
  check (training_environment is null or training_environment in ('gym', 'home', 'club'));
