-- Part 9/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plank KB Pull-through' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plank KB Pull-through' AND m.slug = 'anti-rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plank KB Pull-through' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Plate Roll Up/Down' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Prone Shoulder Press (Block)' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Prone Shoulder Press (Block)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pull RB Down + March' AND m.slug = 'pull-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pull RB Down + March' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pull RB Down + March' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pull Up' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Pull Up' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Push Press' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Push Press' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Push Up' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Push Up' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND m.slug = 'sprint';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Reactive Cone Drill' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Reactive Cone Drill' AND m.slug = 'reactive-footwork';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Reactive Cone Drill' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Renegade Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Renegade Row' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Renegade Row' AND m.slug = 'anti-rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Rev Lunge to Front Lunge' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Rev Lunge to Front Lunge' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Romanian Deadlift (RDL)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Romanian Deadlift (RDL)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Russian Twist' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Russian Twist' AND m.slug = 'twist';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Scapular Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Scapular Push Up' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Seated Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Seated Squat + SA OH Press' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Seated Squat + SA OH Press' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Shadow Padel (+ RB)' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Shadow Padel (+ RB)' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Shadow Padel (+ RB)' AND m.slug = 'open-stance-loading';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Shoulder Press' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Shoulder Press' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Plank (Reach / Lift / Cable)' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Plank (Reach / Lift / Cable)' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle + Turn' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle + Turn' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle + Turn' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle 1-2-1-3' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle 1-2-1-3' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle 1-2-1-3' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle with RB' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle with RB' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Shuffle with RB' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Steps / Side Shuffle' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Steps / Side Shuffle' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Side Steps / Side Shuffle' AND m.slug = 'change-of-direction';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Arm DB Press' AND m.slug = 'push-vertical';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Arm DB Press' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Arm KB Swing' AND m.slug = 'hinge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Arm KB Swing' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Arm KB Swing' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Arm Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Leg / Half Kneeling Halo' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Leg / Half Kneeling Halo' AND m.slug = 'overhead-support';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Leg Box Squat' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Leg Box Squat' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Leg RDL' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Single Leg RDL' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Skater Jump to SL Jump' AND m.slug = 'shuffle';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Skater Jump to SL Jump' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Skater Jump to SL Jump' AND m.slug = 'lateral-movement';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Split Stance Weighted Ball Circles' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Split Stance Weighted Ball Circles' AND m.slug = 'lunge';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Split Stance Weighted Ball Circles' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Split Step and Hold' AND m.slug = 'split-step';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Split Step and Hold' AND m.slug = 'gait';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Split Step and Hold' AND m.slug = 'land';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Squat Slam / Rotation' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Squat Slam / Rotation' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Squat and Cable Push' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Squat and Cable Push' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Squat and Cable Push' AND m.slug = 'anti-rotation';
