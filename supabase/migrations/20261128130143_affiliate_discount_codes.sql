-- Affiliate discount codes. The percent is taken from the affiliate commission, not from CorePadel.

create table public.affiliate_discount_codes (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  code text not null unique,
  percent numeric(5, 2) not null check (percent > 0 and percent <= 100),
  expires_at timestamptz,
  active boolean not null default true,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_discount_codes_code_format check (code ~ '^[A-Z0-9]{4,20}$')
);

create index affiliate_discount_codes_affiliate_idx
  on public.affiliate_discount_codes (affiliate_id, created_at desc);

create table public.affiliate_discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.affiliate_discount_codes (id) on delete cascade,
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  percent numeric(5, 2) not null check (percent > 0 and percent <= 100),
  created_at timestamptz not null default now()
);

create index affiliate_discount_redemptions_discount_idx
  on public.affiliate_discount_redemptions (discount_id);
create index affiliate_discount_redemptions_affiliate_idx
  on public.affiliate_discount_redemptions (affiliate_id);

alter table public.affiliate_discount_codes enable row level security;
alter table public.affiliate_discount_redemptions enable row level security;

revoke all on public.affiliate_discount_codes from anon, authenticated;
revoke all on public.affiliate_discount_redemptions from anon, authenticated;
grant select on public.affiliate_discount_codes to authenticated;
grant select on public.affiliate_discount_redemptions to authenticated;

create policy affiliate_discount_codes_select
  on public.affiliate_discount_codes
  for select
  to authenticated
  using (
    (select public.is_admin())
    or affiliate_id in (
      select a.id from public.affiliates a where a.user_id = (select auth.uid())
    )
  );

create policy affiliate_discount_redemptions_select
  on public.affiliate_discount_redemptions
  for select
  to authenticated
  using (
    (select public.is_admin())
    or affiliate_id in (
      select a.id from public.affiliates a where a.user_id = (select auth.uid())
    )
  );

comment on table public.affiliate_discount_codes is
  'Percent-off codes owned by an affiliate. The discount is subtracted from that affiliate commission rate.';
