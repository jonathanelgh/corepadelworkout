-- Part 4/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Windmill KB' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Windmill KB' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Halo (Plate / KB / DB)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Halo (Plate / KB / DB)' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Halo (Plate / KB / DB)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Jump (RB Assisted)' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Jump (RB Assisted)' AND c.slug = 'strength_speedstrength';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Jump (RB Assisted)' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Knees' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Knees' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Knees' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'High Knees' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Hip Thrust (Single Leg)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Hip Thrust (Single Leg)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Hip Thrust (Single Leg)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'In and Out Squat' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'In and Out Squat' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'In and Out Squat' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Incline Push Up' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Incline Push Up' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Inverted Row' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Inverted Row' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Jump Forward/Back (Line)' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Jump Forward/Back (Line)' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Jump Forward/Back (Line)' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Kettlebell Swing' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Kettlebell Swing' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Kettlebell Swing' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Knee Push Up' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Knee Push Up' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Knee to Low Squat' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Knee to Low Squat' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Knee to Low Squat' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Ladder / Cone Drills' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Ladder / Cone Drills' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Ladder / Cone Drills' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Ladder / Cone Drills' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Lunge & Press' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Lunge & Press' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Lunge & Press' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Press' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Press' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Rotation' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Rotation' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Rotation' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Squat & OH Press (L to R)' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Squat & OH Press (L to R)' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine Squat & OH Press (L to R)' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine T, Push + Rotation' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine T, Push + Rotation' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Landmine T, Push + Rotation' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lat Pulldown' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lat Pulldown' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Bound to Lunge' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Bound to Lunge' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Bound to Lunge' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Bounds' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Bounds' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Bounds' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Step Over + Shadow DB' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Step Over + Shadow DB' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Lateral Step Over + Shadow DB' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Man Makers' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Man Makers' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Man Makers' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Marching Drill' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Marching Drill' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Marching Drill' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Marching Drill' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Mountain Climbers' AND c.slug = 'conditioning';
