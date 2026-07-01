-- Date of birth collected during onboarding (day / month / year → date).

alter table public.profiles
  add column if not exists date_of_birth date;

comment on column public.profiles.date_of_birth is 'Member date of birth from onboarding (used for age in admin).';
