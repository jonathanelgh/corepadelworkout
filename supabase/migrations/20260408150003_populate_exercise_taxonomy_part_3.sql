-- Part 3/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Box Drop Down (Hold/Jump)' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Box Drop Down (Hold/Jump)' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Box Step Up to Runner''s Pose' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Box Step Up to Runner''s Pose' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Bulgarian Split Squat' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Bulgarian Split Squat' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Bulgarian Split Squat' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Burpees' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Burpees' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Burpees' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Cable / Med Ball Rotation' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Cable / Med Ball Rotation' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Cable / Med Ball Rotation' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Carioca' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Carioca' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Carioca' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Carioca' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crab Walks (Miniband)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crab Walks (Miniband)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crab Walks (Miniband)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crossover Steps (Line)' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crossover Steps (Line)' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crossover Steps (Line)' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Crossover Steps (Line)' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Curls → Press → Dips' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Curls → Press → Dips' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Deficit Lunge' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Deficit Lunge' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Deficit Lunge' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dribble to Bosu Lunge' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dribble to Bosu Lunge' AND c.slug = 'balance';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dribble to Bosu Lunge' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dribble to Bosu Lunge' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Bench Press (Single)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Bench Press (Single)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Snatch' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Snatch' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Snatch' AND c.slug = 'skill-based';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Thruster' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Thruster' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Dumbbell Thruster' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Elevated Clamshells' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Elevated Clamshells' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Elevated Clamshells' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Explosive Push Up' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Explosive Push Up' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Explosive Row' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Explosive Row' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Face Pull (+ Ext. Rotation)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Face Pull (+ Ext. Rotation)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Glute Bridge (Walk)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Glute Bridge (Walk)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Glute Bridge (Walk)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet / Sumo Squat' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet / Sumo Squat' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet / Sumo Squat' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet Squat Press + Rotation' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet Squat Press + Rotation' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet Squat Press + Rotation' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet Squat Shoulder Press' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet Squat Shoulder Press' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Goblet Squat Shoulder Press' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Gorilla Row' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Gorilla Row' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Med Ball Slam' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Med Ball Slam' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Med Ball Slam' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling SA KB Press' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling SA KB Press' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Half Kneeling Windmill KB' AND c.slug = 'strength_explosive';
