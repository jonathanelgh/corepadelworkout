-- Stripe subscriptions + free program flag.

alter table public.programs
  add column if not exists is_free boolean not null default false;

comment on column public.programs.is_free is 'When true, any signed-in user can access without Pro subscription.';

alter table public.subscription_plans
  add column if not exists stripe_price_id text;

comment on column public.subscription_plans.stripe_price_id is 'Stripe Price ID for Checkout (e.g. price_xxx).';

alter table public.profiles
  add column if not exists stripe_customer_id text;

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.profiles.stripe_customer_id is 'Stripe Customer ID for billing portal and subscription sync.';

-- Free programs are accessible without Pro; paid programs need Pro or enrollment.
create or replace function public.user_has_program_access(p_user_id uuid, p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.programs p
    where p.id = p_program_id
      and p.status = 'published'
      and p.is_free = true
  )
  or exists (
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

comment on function public.user_has_program_access(uuid, uuid) is
  'True if program is free, user has active Pro, or an active enrollment.';

-- Self-enroll only for free published programs (paid access via Stripe webhooks).
drop policy if exists "Users enroll in published programs" on public.program_enrollments;

create policy "Users enroll in free published programs"
  on public.program_enrollments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.programs p
      where p.id = program_enrollments.program_id
        and p.status = 'published'
        and p.is_free = true
    )
  );
