-- Part 7/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Barbell Deadlift' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bear Crawl (Static / Dynamic)' AND m.slug = 'crawl';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bear Crawl (Static / Dynamic)' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bear Crawl (Static / Dynamic)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bird Dog (Standard / RB)' AND m.slug = 'anti-rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bird Dog (Standard / RB)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bird Dog (Standard / RB)' AND m.slug = 'bridge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over DB Rot.' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over DB Rot.' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over DB Rot.' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 3 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over DB Rot.' AND m.slug = 'single-leg-deceleration';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over Shadow' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over Shadow' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bosu Step Over Shadow' AND m.slug = 'open-stance-loading';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bottoms Up KB Carry' AND m.slug = 'carry';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bottoms Up KB Carry' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Box Drop Down (Hold/Jump)' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Box Drop Down (Hold/Jump)' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Box Drop Down (Hold/Jump)' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Box Step Up to Runner''s Pose' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Box Step Up to Runner''s Pose' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bulgarian Split Squat' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bulgarian Split Squat' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Bulgarian Split Squat' AND m.slug = 'single-leg-deceleration';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Burpees' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Burpees' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Burpees' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Cable / Med Ball Rotation' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Cable / Med Ball Rotation' AND m.slug = 'rotational-transfer';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Carioca' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Carioca' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Carioca' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Crab Walks (Miniband)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Crab Walks (Miniband)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Crossover Steps (Line)' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Crossover Steps (Line)' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Crossover Steps (Line)' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Curls → Press → Dips' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Curls → Press → Dips' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Curls → Press → Dips' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND m.slug = 'anti-rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Deficit Lunge' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Deficit Lunge' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dribble to Bosu Lunge' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dribble to Bosu Lunge' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dribble to Bosu Lunge' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 3 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dribble to Bosu Lunge' AND m.slug = 'single-leg-deceleration';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dumbbell Bench Press (Single)' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dumbbell Snatch' AND m.slug = 'hinge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dumbbell Snatch' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dumbbell Snatch' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dumbbell Thruster' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Dumbbell Thruster' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Elevated Clamshells' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Elevated Clamshells' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Explosive Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Explosive Push Up' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Explosive Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Explosive Row' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Face Pull (+ Ext. Rotation)' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Face Pull (+ Ext. Rotation)' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Glute Bridge (Walk)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Glute Bridge (Walk)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Goblet / Sumo Squat' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Goblet / Sumo Squat' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Goblet Squat Press + Rotation' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Goblet Squat Press + Rotation' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Goblet Squat Shoulder Press' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Goblet Squat Shoulder Press' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Gorilla Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Gorilla Row' AND m.slug = 'hinge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND m.slug = 'hinge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Med Ball Slam' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Med Ball Slam' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Med Ball Slam' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling SA KB Press' AND m.slug = 'push-vertical';
