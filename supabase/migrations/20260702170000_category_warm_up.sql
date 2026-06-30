-- Add Warm Up program category (shown in admin create/edit program and storefront filters).

insert into public.categories (name, slug, description, sort_order)
values (
  'Warm Up',
  'warm-up',
  'Pre-match and on-court warm-up routines',
  5
)
on conflict (slug) do nothing;

-- Re-tag the seeded 7-minute warm-up program when it still uses footwork only.
do $$
declare
  v_program_id uuid;
  v_warm_up_id uuid;
  v_footwork_id uuid;
begin
  select id into v_warm_up_id from public.categories where slug = 'warm-up' limit 1;
  if v_warm_up_id is null then
    return;
  end if;

  select id into v_program_id from public.programs where slug = '7-minute-warm-up' limit 1;
  if v_program_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.program_categories pc
    where pc.program_id = v_program_id
      and pc.category_id = v_warm_up_id
  ) then
    return;
  end if;

  select id into v_footwork_id from public.categories where slug = 'footwork' limit 1;

  if v_footwork_id is not null and exists (
    select 1
    from public.program_categories pc
    where pc.program_id = v_program_id
      and pc.category_id = v_footwork_id
  ) then
    update public.program_categories
    set category_id = v_warm_up_id
    where program_id = v_program_id
      and category_id = v_footwork_id;
  else
    insert into public.program_categories (program_id, category_id, sort_order)
    values (v_program_id, v_warm_up_id, 0)
    on conflict do nothing;
  end if;
end;
$$;
