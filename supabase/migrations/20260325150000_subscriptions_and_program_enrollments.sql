-- Pro monthly subscription (all programs) + per-program purchases (enrollments).
-- Rows are normally created/updated by Stripe webhooks (service role), not by clients.

-- ---------------------------------------------------------------------------
-- Subscription plans (catalog; Stripe Price IDs can live in app env or a column later)
-- ---------------------------------------------------------------------------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  interval text not null,
  price_amount numeric(10, 2),
  currency text not null default 'eur',
  grants_all_programs boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint subscription_plans_interval_check check (interval in ('month', 'year'))
);

comment on table public.subscription_plans is 'Sellable subscription products; Pro plan sets grants_all_programs = true.';
comment on column public.subscription_plans.grants_all_programs is 'When true, an active subscription row grants access to every published program.';

create unique index subscription_plans_slug_key on public.subscription_plans (slug);

create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row
  execute function public.set_row_updated_at();

alter table public.subscription_plans enable row level security;

create policy "Subscription plans are readable by everyone"
  on public.subscription_plans
  for select
  to anon, authenticated
  using (active = true);

create policy "Admins manage subscription plans"
  on public.subscription_plans
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update subscription plans"
  on public.subscription_plans
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete subscription plans"
  on public.subscription_plans
  for delete
  to authenticated
  using (public.is_admin());

insert into public.subscription_plans (slug, name, description, interval, grants_all_programs, active)
values (
  'pro-monthly',
  'Pro',
  'Full access to all programs while subscribed.',
  'month',
  true,
  true
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Customer subscriptions (one logical Stripe subscription per row; update via webhook)
-- ---------------------------------------------------------------------------

create table public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status text not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_subscriptions_status_check check (
    status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid')
  )
);

comment on table public.customer_subscriptions is 'Stripe-synced subscription; active Pro = current_period_end > now() and status in (active, trialing).';

create unique index customer_subscriptions_stripe_sub_key
  on public.customer_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index customer_subscriptions_user_id_idx on public.customer_subscriptions (user_id);
create index customer_subscriptions_period_idx on public.customer_subscriptions (user_id, current_period_end desc);

create trigger customer_subscriptions_set_updated_at
  before update on public.customer_subscriptions
  for each row
  execute function public.set_row_updated_at();

alter table public.customer_subscriptions enable row level security;

create policy "Users read own subscriptions"
  on public.customer_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all subscriptions"
  on public.customer_subscriptions
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert subscriptions"
  on public.customer_subscriptions
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update subscriptions"
  on public.customer_subscriptions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Stripe webhooks typically use the service role (bypasses RLS). Admins can also manage rows in-dashboard.

-- ---------------------------------------------------------------------------
-- Per-program purchase / enrollment (lifetime access unless refunded)
-- ---------------------------------------------------------------------------

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  price_paid numeric(10, 2) not null,
  currency text not null default 'eur',
  status text not null default 'active',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  enrolled_at timestamptz not null default now(),
  constraint program_enrollments_status_check check (status in ('active', 'refunded'))
);

comment on table public.program_enrollments is 'Single-course access after successful payment; price_paid is snapshot at purchase.';
comment on column public.program_enrollments.status is 'active = entitled; refunded = revoked.';

create unique index program_enrollments_user_program_active_key
  on public.program_enrollments (user_id, program_id)
  where status = 'active';

create index program_enrollments_user_id_idx on public.program_enrollments (user_id);

alter table public.program_enrollments enable row level security;

create policy "Users read own enrollments"
  on public.program_enrollments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all enrollments"
  on public.program_enrollments
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert enrollments"
  on public.program_enrollments
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update enrollments"
  on public.program_enrollments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Access check: active Pro (all programs) OR active enrollment for that program
-- ---------------------------------------------------------------------------

create or replace function public.user_has_program_access(p_user_id uuid, p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customer_subscriptions cs
    join public.subscription_plans sp on sp.id = cs.plan_id
    where cs.user_id = p_user_id
      and sp.grants_all_programs = true
      and cs.status in ('active', 'trialing')
      and cs.current_period_end > now()
  )
  or exists (
    select 1
    from public.program_enrollments e
    where e.user_id = p_user_id
      and e.program_id = p_program_id
      and e.status = 'active'
  );
$$;

comment on function public.user_has_program_access(uuid, uuid) is 'True if user has active Pro (all courses) or an active enrollment for the program.';

revoke all on function public.user_has_program_access(uuid, uuid) from public;
grant execute on function public.user_has_program_access(uuid, uuid) to authenticated;
