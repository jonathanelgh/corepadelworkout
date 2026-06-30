-- Launch email tracking + per-signup token for early-access Pro signup links.

alter table public.pre_launch_signups
  add column if not exists signup_token uuid not null default gen_random_uuid(),
  add column if not exists launch_email_sent_at timestamptz,
  add column if not exists pro_redeemed_at timestamptz,
  add column if not exists redeemed_user_id uuid references auth.users (id) on delete set null;

update public.pre_launch_signups
set signup_token = gen_random_uuid()
where signup_token is null;

create unique index if not exists pre_launch_signups_signup_token_key
  on public.pre_launch_signups (signup_token);

create index if not exists pre_launch_signups_launch_email_sent_at_idx
  on public.pre_launch_signups (launch_email_sent_at desc nulls last);

comment on column public.pre_launch_signups.signup_token is
  'Unique token embedded in launch signup URL for 6-month Pro offer.';
comment on column public.pre_launch_signups.launch_email_sent_at is
  'When the go-live launch email was last sent to this address.';
comment on column public.pre_launch_signups.pro_redeemed_at is
  'When the member claimed 6 months Pro via the launch signup link.';

create policy "Admins read pre_launch_signups"
  on public.pre_launch_signups for select to authenticated
  using (public.is_admin());

create policy "Admins update pre_launch_signups"
  on public.pre_launch_signups for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
