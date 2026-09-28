-- Shareable signup offers that grant free Pro months on account creation.

create table if not exists public.signup_offers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  months integer not null check (months in (1, 3, 6, 12)),
  active boolean not null default true,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint signup_offers_code_format check (code ~ '^[A-Z0-9-]{2,40}$')
);

create unique index if not exists signup_offers_code_key
  on public.signup_offers (code);

create table if not exists public.signup_offer_redemptions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.signup_offers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  constraint signup_offer_redemptions_offer_user_unique unique (offer_id, user_id)
);

create index if not exists signup_offer_redemptions_offer_id_idx
  on public.signup_offer_redemptions (offer_id);

create index if not exists signup_offer_redemptions_user_id_idx
  on public.signup_offer_redemptions (user_id);

alter table public.signup_offers enable row level security;
alter table public.signup_offer_redemptions enable row level security;

create policy "Admins read signup_offers"
  on public.signup_offers for select to authenticated
  using (public.is_admin());

create policy "Admins insert signup_offers"
  on public.signup_offers for insert to authenticated
  with check (public.is_admin());

create policy "Admins update signup_offers"
  on public.signup_offers for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read signup_offer_redemptions"
  on public.signup_offer_redemptions for select to authenticated
  using (public.is_admin());

comment on table public.signup_offers is
  'Shareable signup codes that auto-grant free Pro months on account creation.';
comment on table public.signup_offer_redemptions is
  'One redemption per user per signup offer.';

-- Default shareable 3-month Pro offer.
insert into public.signup_offers (code, name, months, active)
values ('PRO3', '3 months free Pro', 3, true)
on conflict (code) do nothing;
