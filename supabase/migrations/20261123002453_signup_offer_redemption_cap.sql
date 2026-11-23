-- Stop a capped signup offer from being redeemed twice under concurrent signups.
-- Locks the offer row so the count and insert happen one at a time.

create or replace function public.enforce_signup_offer_redemption_cap()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cap integer;
  used integer;
begin
  select max_redemptions
    into cap
    from public.signup_offers
    where id = new.offer_id
    for update;

  if cap is null then
    return new;
  end if;

  select count(*)
    into used
    from public.signup_offer_redemptions
    where offer_id = new.offer_id;

  if used >= cap then
    raise exception 'signup offer redemption limit reached'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists signup_offer_redemptions_cap on public.signup_offer_redemptions;

create trigger signup_offer_redemptions_cap
  before insert on public.signup_offer_redemptions
  for each row
  execute function public.enforce_signup_offer_redemption_cap();

revoke all on function public.enforce_signup_offer_redemption_cap() from public, anon, authenticated;
grant execute on function public.enforce_signup_offer_redemption_cap() to service_role;
