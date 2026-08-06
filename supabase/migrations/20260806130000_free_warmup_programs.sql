-- All published court warm-up variants are free lead magnets.
update public.programs
set is_free = true
where slug in ('court-warm-up', 'court-warm-up-copy', 'court-warm-up-copy-1')
  and status = 'published';
