-- Part 8/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling SA KB Press' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Windmill KB' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Windmill KB' AND m.slug = 'hinge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Half Kneeling Windmill KB' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Halo (Plate / KB / DB)' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Halo (Plate / KB / DB)' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'High Jump (RB Assisted)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'High Jump (RB Assisted)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'High Knees' AND m.slug = 'sprint';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'High Knees' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Hip Thrust (Single Leg)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Hip Thrust (Single Leg)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'In and Out Squat' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'In and Out Squat' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Incline Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Inverted Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Inverted Row' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Inverted Row' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Jump Forward/Back (Line)' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Jump Forward/Back (Line)' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Jump Forward/Back (Line)' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Kettlebell Swing' AND m.slug = 'hinge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Kettlebell Swing' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Kettlebell Swing' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Knee Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Knee to Low Squat' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Knee to Low Squat' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ladder / Cone Drills' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ladder / Cone Drills' AND m.slug = 'reactive-footwork';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ladder / Cone Drills' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Lunge & Press' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Lunge & Press' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Lunge & Press' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Press' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Press' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 3 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Rotation' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Rotation' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Rotation' AND m.slug = 'rotational-transfer';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Squat & OH Press (L to R)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine Squat & OH Press (L to R)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine T, Push + Rotation' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine T, Push + Rotation' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Landmine T, Push + Rotation' AND m.slug = 'rotational-transfer';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lat Pulldown' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lat Pulldown' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Bound to Lunge' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Bound to Lunge' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Bounds' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Bounds' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Bounds' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Step Over + Shadow DB' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Step Over + Shadow DB' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Lateral Step Over + Shadow DB' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Man Makers' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Man Makers' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Man Makers' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 3 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Man Makers' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Marching Drill' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Marching Drill' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Mountain Climbers' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Mountain Climbers' AND m.slug = 'sprint';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Mountain Climbers' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Offset OH Carry March' AND m.slug = 'carry';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Offset OH Carry March' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Offset OH Carry March' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Overhead Carry' AND m.slug = 'carry';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Overhead Carry' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Overhead Carry' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Overhead Triceps Extension' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pallof Press (Standard / Chaos)' AND m.slug = 'anti-rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pallof Press (Standard / Chaos)' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plank (Up-Down / Taps)' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plank (Up-Down / Taps)' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plank (Up-Down / Taps)' AND m.slug = 'anti-rotation';
