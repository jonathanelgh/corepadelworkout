-- Pro conversion nurture drip for free members who never redeemed a signup offer.

create table if not exists public.pro_conversion_nurture (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  sequence_started_at timestamptz not null,
  last_step_sent integer not null default 0
    check (last_step_sent >= 0 and last_step_sent <= 4),
  next_send_at timestamptz not null,
  stopped_at timestamptz,
  stop_reason text
    check (
      stop_reason is null
      or stop_reason in ('pro', 'offer', 'unsubscribed', 'completed')
    ),
  unsubscribe_token text not null unique
    default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pro_conversion_nurture_due_idx
  on public.pro_conversion_nurture (next_send_at)
  where stopped_at is null and last_step_sent < 4;

comment on table public.pro_conversion_nurture is
  '4-email / 14-day Pro conversion drip for free members without signup-offer Pro.';

create trigger pro_conversion_nurture_set_updated_at
  before update on public.pro_conversion_nurture
  for each row
  execute function public.set_row_updated_at();

alter table public.pro_conversion_nurture enable row level security;

-- Service role only (cron + unsubscribe). No authenticated policies.
