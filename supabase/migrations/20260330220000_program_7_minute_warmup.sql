-- Single-session program: ~7 minute on-court padel warm-up.
-- Requires seeded exercises from 20260330210000_seed_padel_exercises.sql (matching titles).
-- Idempotent: skips if a program with slug `7-minute-warm-up` already exists.

do $$
declare
  v_program_id uuid;
  v_track_id uuid;
  v_session_id uuid;
  v_loc_id uuid;
  v_diff_id uuid;
  v_cat_id uuid;
begin
  if exists (select 1 from public.programs p where p.slug = '7-minute-warm-up') then
    return;
  end if;

  select l.id into v_loc_id from public.locations l where l.slug = 'at-the-court' limit 1;
  if v_loc_id is null then
    raise exception 'Location at-the-court not found';
  end if;

  select d.id into v_diff_id from public.difficulty_levels d where d.slug = 'all-levels' limit 1;

  insert into public.programs (
    title,
    slug,
    description,
    body,
    difficulty_level_id,
    status,
    cover_image_url,
    promo_video_url,
    price,
    compare_at_price,
    duration_weeks,
    sessions_per_week,
    minutes_per_session,
    outcomes
  )
  values (
    '7 Minute Warm Up',
    '7-minute-warm-up',
    'A simple on-court routine to raise your pulse, wake up ankles and hips, and dial in footwork before you play.',
    E'Use this as soon as you step on court: light to steady effort, no static stretching cold. Spend about one minute per station in order; if you finish early, repeat quick feet or split-steps until the block ends.',
    v_diff_id,
    'published',
    null,
    null,
    null,
    null,
    null,
    null,
    7,
    '[
      "Elevated heart rate and body temperature",
      "Ankles and calves ready for hops and landings",
      "Hips and upper back loose for rotation",
      "Split-step and lateral movement sharpened"
    ]'::jsonb
  )
  returning id into v_program_id;

  select c.id into v_cat_id from public.categories c where c.slug = 'footwork' limit 1;
  if v_cat_id is not null then
    insert into public.program_categories (program_id, category_id, sort_order)
    values (v_program_id, v_cat_id, 0);
  end if;

  insert into public.program_location_tracks (program_id, location_id, sort_order)
  values (v_program_id, v_loc_id, 0)
  returning id into v_track_id;

  insert into public.program_sessions (track_id, name, description, duration_minutes, sort_order)
  values (
    v_track_id,
    'Court warm-up',
    'Seven stations, ~1 minute each. No equipment required; stay on your feet between moves.',
    7,
    0
  )
  returning id into v_session_id;

  insert into public.program_exercises (session_id, exercise_id, sort_order, duration_minutes, sets, reps)
  select v_session_id, e.id, ord - 1, 1, null, null
  from unnest(array[
    'Thoracic open book',
    'Calf raises (straight and bent knee)',
    'Quick feet on the line',
    'Split-step practice (shadow)',
    'Lateral skater hops',
    'Drop-step reactive starts',
    'Wall sit isometric'
  ]) with ordinality as t(title, ord)
  join public.exercises e on e.title = t.title;

  if (select count(*) from public.program_exercises where session_id = v_session_id) < 7 then
    raise warning '7 Minute Warm Up: fewer than 7 exercises linked (missing titles in public.exercises?)';
  end if;
end $$;
