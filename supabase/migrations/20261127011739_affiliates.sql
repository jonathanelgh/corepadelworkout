-- Affiliate accounts, 30-day first-touch attribution, and commission ledger.
-- Admins (admin_users) create affiliates. Affiliates read their own rows.
-- Writes from tracking and Stripe run with the service role, which bypasses RLS.

create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null unique,
  display_name text not null,
  email text not null,
  phone text,
  instagram text,
  youtube text,
  facebook text,
  tiktok text,
  website text,
  notes text,
  status text not null default 'active' check (status in ('active', 'paused')),
  commission_percent numeric(5, 2) not null default 50 check (commission_percent >= 0 and commission_percent <= 100),
  commission_months integer not null default 6 check (commission_months >= 1 and commission_months <= 60),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliates_code_format check (code ~ '^[A-Z0-9]{6,12}$')
);

create index affiliates_created_by_idx on public.affiliates (created_by);
create index affiliates_status_idx on public.affiliates (status);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  visitor_id uuid not null,
  landing_path text,
  referrer text,
  created_at timestamptz not null default now()
);

create index affiliate_clicks_affiliate_created_idx
  on public.affiliate_clicks (affiliate_id, created_at desc);
create index affiliate_clicks_visitor_idx on public.affiliate_clicks (visitor_id);

create table public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status text not null default 'paid' check (status in ('pending', 'paid')),
  period_label text,
  notes text,
  paid_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index affiliate_payouts_affiliate_created_idx
  on public.affiliate_payouts (affiliate_id, created_at desc);
create index affiliate_payouts_created_by_idx on public.affiliate_payouts (created_by);

create table public.affiliate_attributions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  visitor_id uuid not null unique,
  user_id uuid unique references auth.users (id) on delete set null,
  first_touch_at timestamptz not null default now(),
  expires_at timestamptz not null,
  commission_percent numeric(5, 2) not null,
  commission_months integer not null,
  subscription_started_at timestamptz,
  stripe_subscription_id text,
  commission_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index affiliate_attributions_affiliate_idx on public.affiliate_attributions (affiliate_id);
create index affiliate_attributions_expires_idx on public.affiliate_attributions (expires_at);

create table public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  attribution_id uuid not null references public.affiliate_attributions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  currency text not null default 'eur',
  sale_amount_cents integer not null check (sale_amount_cents >= 0),
  commission_percent numeric(5, 2) not null,
  commission_cents integer not null check (commission_cents >= 0),
  earned_at timestamptz not null,
  payout_id uuid references public.affiliate_payouts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index affiliate_commissions_affiliate_earned_idx
  on public.affiliate_commissions (affiliate_id, earned_at desc);
create index affiliate_commissions_attribution_idx on public.affiliate_commissions (attribution_id);
create index affiliate_commissions_user_idx on public.affiliate_commissions (user_id);
create index affiliate_commissions_payout_idx on public.affiliate_commissions (payout_id);

alter table public.affiliates enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_attributions enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payouts enable row level security;

revoke all on public.affiliates from anon, authenticated;
revoke all on public.affiliate_clicks from anon, authenticated;
revoke all on public.affiliate_attributions from anon, authenticated;
revoke all on public.affiliate_commissions from anon, authenticated;
revoke all on public.affiliate_payouts from anon, authenticated;

grant select on public.affiliates to authenticated;
grant select on public.affiliate_clicks to authenticated;
grant select on public.affiliate_attributions to authenticated;
grant select on public.affiliate_commissions to authenticated;
grant select on public.affiliate_payouts to authenticated;

grant update (
  display_name,
  phone,
  instagram,
  youtube,
  facebook,
  tiktok,
  website,
  updated_at
) on public.affiliates to authenticated;

create policy affiliates_select
  on public.affiliates
  for select
  to authenticated
  using (
    (select public.is_admin())
    or user_id = (select auth.uid())
  );

create policy affiliates_update_own
  on public.affiliates
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy affiliate_clicks_select
  on public.affiliate_clicks
  for select
  to authenticated
  using (
    (select public.is_admin())
    or affiliate_id in (
      select a.id from public.affiliates a where a.user_id = (select auth.uid())
    )
  );

create policy affiliate_attributions_select
  on public.affiliate_attributions
  for select
  to authenticated
  using (
    (select public.is_admin())
    or affiliate_id in (
      select a.id from public.affiliates a where a.user_id = (select auth.uid())
    )
  );

create policy affiliate_commissions_select
  on public.affiliate_commissions
  for select
  to authenticated
  using (
    (select public.is_admin())
    or affiliate_id in (
      select a.id from public.affiliates a where a.user_id = (select auth.uid())
    )
  );

create policy affiliate_payouts_select
  on public.affiliate_payouts
  for select
  to authenticated
  using (
    (select public.is_admin())
    or affiliate_id in (
      select a.id from public.affiliates a where a.user_id = (select auth.uid())
    )
  );

comment on table public.affiliates is
  'Affiliate login accounts. Commission percent and months apply to new referrals. Existing attributions keep the rate from the first visit.';
comment on table public.affiliate_attributions is
  'First-touch referral. expires_at is 30 days after the first visit. Commission runs from subscription start for commission_months.';
