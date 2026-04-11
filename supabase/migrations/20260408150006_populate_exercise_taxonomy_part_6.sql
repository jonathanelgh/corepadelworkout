-- Part 6/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle with RB' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle with RB' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle with RB' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Steps / Side Shuffle' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Steps / Side Shuffle' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Steps / Side Shuffle' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Steps / Side Shuffle' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm DB Press' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm DB Press' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm KB Swing' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm KB Swing' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm KB Swing' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm Row' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Arm Row' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg / Half Kneeling Halo' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg / Half Kneeling Halo' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg / Half Kneeling Halo' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg Box Squat' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg Box Squat' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg Box Squat' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg RDL' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Single Leg RDL' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Skater Jump to SL Jump' AND c.slug = 'strength_plyometric';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Skater Jump to SL Jump' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Skater Jump to SL Jump' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Stance Weighted Ball Circles' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Stance Weighted Ball Circles' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Stance Weighted Ball Circles' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Step and Hold' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Step and Hold' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Step and Hold' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Split Step and Hold' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Squat Slam / Rotation' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Squat Slam / Rotation' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Squat Slam / Rotation' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Squat and Cable Push' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Squat and Cable Push' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Squat and Cable Push' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Tennis Specific Lunges' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Tennis Specific Lunges' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Tennis Specific Lunges' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Tiptoe Walk (Lateral)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Tiptoe Walk (Lateral)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Tiptoe Walk (Lateral)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wall Sit Toe Raise' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wall Sit Toe Raise' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wall Sit Toe Raise' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wall Slides' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wall Slides' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wall Slides' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wrist Flexion/Extension' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Wrist Flexion/Extension' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'YT Raises' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'YT Raises' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'YT Raises' AND c.slug = 'mobility';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3-Way / 5-Way Lunge' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3-Way / 5-Way Lunge' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3-way Knee Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3-way Push Up' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3-way Push Up' AND m.slug = 'plank';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3-way Push Up' AND m.slug = 'anti-extension';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3D Wall Lean Calf Raise' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '3D Wall Lean Calf Raise' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Around the World Slam' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Around the World Slam' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Assisted Push Up (RB)' AND m.slug = 'push-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ball Slam Broad Jump' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ball Slam Broad Jump' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ball Slam Broad Jump' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ball Slam on Knees' AND m.slug = 'throw';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ball Slam on Knees' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 2 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Ball Slam on Knees' AND m.slug = 'jump';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Band External Rotation' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Band External Rotation' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Band Pull Apart' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Band Pull Apart' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Band Row' AND m.slug = 'pull-horizontal';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Barbell Deadlift' AND m.slug = 'reach';
