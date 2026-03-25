-- Store onboarding environment preference as a multi-select.

alter table public.profiles
  add column if not exists training_environments text[] not null default '{}';

comment on column public.profiles.training_environments is 'Preferred training locations from onboarding (multi-select): gym, home, club.';

alter table public.profiles drop constraint if exists profiles_training_environments_check;
alter table public.profiles
  add constraint profiles_training_environments_check
  check (training_environments <@ array['gym', 'home', 'club']::text[]);
