-- Monthly payout reports. A finished calendar month can be listed, locked, then paid per affiliate.

create table public.affiliate_payout_reports (
  id uuid primary key default gen_random_uuid(),
  period_start date not null unique,
  status text not null default 'open' check (status in ('open', 'locked')),
  locked_at timestamptz,
  locked_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index affiliate_payout_reports_locked_by_idx on public.affiliate_payout_reports (locked_by);
create index affiliate_payout_reports_created_by_idx on public.affiliate_payout_reports (created_by);

alter table public.affiliate_payouts
  add column report_id uuid references public.affiliate_payout_reports (id) on delete cascade;

create index affiliate_payouts_report_id_idx on public.affiliate_payouts (report_id);
create unique index affiliate_payouts_report_affiliate_currency_idx
  on public.affiliate_payouts (report_id, affiliate_id, currency)
  where report_id is not null;

alter table public.affiliate_payout_reports enable row level security;

revoke all on public.affiliate_payout_reports from anon, authenticated;
grant select on public.affiliate_payout_reports to authenticated;

create policy affiliate_payout_reports_select
  on public.affiliate_payout_reports
  for select
  to authenticated
  using (
    (select public.is_admin())
    or id in (
      select p.report_id
      from public.affiliate_payouts p
      where p.report_id is not null
        and p.affiliate_id in (
          select a.id from public.affiliates a where a.user_id = (select auth.uid())
        )
    )
  );

comment on table public.affiliate_payout_reports is
  'One payout report per finished calendar month. Open reports can be rebuilt. Locked reports are final, then each affiliate line is marked paid.';
