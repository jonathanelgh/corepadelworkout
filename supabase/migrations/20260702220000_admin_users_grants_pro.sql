-- Admins get full program access without a Stripe subscription.

create or replace function public.user_has_program_access(p_user_id uuid, p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = p_user_id
  )
  or exists (
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
  'True if user is admin, program is free, user has active Pro, or an active enrollment.';
