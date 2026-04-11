-- Part 10/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Tennis Specific Lunges' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Tennis Specific Lunges' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Tiptoe Walk (Lateral)' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Tiptoe Walk (Lateral)' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Wall Sit Toe Raise' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Wall Sit Toe Raise' AND m.slug = 'squat';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Wall Slides' AND m.slug = 'rotation';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Wall Slides' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'Wrist Flexion/Extension' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 0 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'YT Raises' AND m.slug = 'reach';
INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, 1 FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = 'YT Raises' AND m.slug = 'rotation';
