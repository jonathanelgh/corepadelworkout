-- Set Pro monthly catalog price to €19.99.

update public.subscription_plans
set
  price_amount = 19.99,
  currency = 'eur',
  updated_at = now()
where slug = 'pro-monthly';
