-- Part 5/10: exercise taxonomy links (generated).

INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Mountain Climbers' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Mountain Climbers' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Offset OH Carry March' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Offset OH Carry March' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Offset OH Carry March' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Overhead Carry' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Overhead Carry' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Overhead Carry' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Overhead Triceps Extension' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Overhead Triceps Extension' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pallof Press (Standard / Chaos)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pallof Press (Standard / Chaos)' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pallof Press (Standard / Chaos)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plank (Up-Down / Taps)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plank (Up-Down / Taps)' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plank (Up-Down / Taps)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plank KB Pull-through' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plank KB Pull-through' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plank KB Pull-through' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plate Roll Up/Down' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plate Roll Up/Down' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Plate Roll Up/Down' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Prone Shoulder Press (Block)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Prone Shoulder Press (Block)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pull RB Down + March' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pull RB Down + March' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pull RB Down + March' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pull Up' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Pull Up' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Push Press' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Push Press' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Push Up' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Push Up' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Reactive Cone Drill' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Reactive Cone Drill' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Reactive Cone Drill' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Reactive Cone Drill' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Renegade Row' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Renegade Row' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Renegade Row' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Rev Lunge to Front Lunge' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Rev Lunge to Front Lunge' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Rev Lunge to Front Lunge' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Romanian Deadlift (RDL)' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Romanian Deadlift (RDL)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Russian Twist' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Russian Twist' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Russian Twist' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Scapular Push Up' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Scapular Push Up' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Seated Row' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Seated Row' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Seated Squat + SA OH Press' AND c.slug = 'strength_explosive';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Seated Squat + SA OH Press' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Seated Squat + SA OH Press' AND c.slug = 'conditioning';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Shadow Padel (+ RB)' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Shadow Padel (+ RB)' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Shadow Padel (+ RB)' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Shadow Padel (+ RB)' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Shoulder Press' AND c.slug = 'strength_hypertrofy';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Shoulder Press' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Plank (Reach / Lift / Cable)' AND c.slug = 'strength_stability';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Plank (Reach / Lift / Cable)' AND c.slug = 'prehab';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Plank (Reach / Lift / Cable)' AND c.slug = 'mobility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle + Turn' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle + Turn' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle + Turn' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle + Turn' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle 1-2-1-3' AND c.slug = 'footwork';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 1 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle 1-2-1-3' AND c.slug = 'agility';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 2 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle 1-2-1-3' AND c.slug = 'coordination';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 3 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle 1-2-1-3' AND c.slug = 'sport-specific';
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, 0 FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = 'Side Shuffle with RB' AND c.slug = 'footwork';
