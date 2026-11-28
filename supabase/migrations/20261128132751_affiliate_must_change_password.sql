-- New affiliate accounts must replace the emailed temporary password on first sign-in.

alter table public.affiliates
  add column must_change_password boolean not null default false;

comment on column public.affiliates.must_change_password is
  'True only for accounts created as affiliates, until they choose their own password.';
