-- Part 1/10: exercise taxonomy links (generated).

TRUNCATE TABLE public.exercise_body_region_links;
TRUNCATE TABLE public.exercise_category_type_links;
TRUNCATE TABLE public.exercise_movement_pattern_links;
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = '3-Way / 5-Way Lunge' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = '3-way Knee Push Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = '3-way Push Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = '3D Wall Lean Calf Raise' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Around the World Slam' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Assisted Push Up (RB)' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Ball Slam Broad Jump' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Ball Slam on Knees' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Band External Rotation' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Band Pull Apart' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Band Row' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Barbell Deadlift' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Bear Crawl (Static / Dynamic)' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Bird Dog (Standard / RB)' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Bosu Step Over DB Rot.' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Bosu Step Over Shadow' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Bottoms Up KB Carry' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Box Drop Down (Hold/Jump)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Box Step Up to Runner''s Pose' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Bulgarian Split Squat' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Burpees' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Cable / Med Ball Rotation' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Carioca' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Crab Walks (Miniband)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Crossover Steps (Line)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Curls → Press → Dips' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Dead Bug (DB / Ball Hold)' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Deficit Lunge' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Dribble to Bosu Lunge' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Dumbbell Bench Press (Single)' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Dumbbell Snatch' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Dumbbell Thruster' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Elevated Clamshells' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Explosive Push Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Explosive Row' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Face Pull (+ Ext. Rotation)' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Glute Bridge (Walk)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Goblet / Sumo Squat' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Goblet Squat Press + Rotation' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Goblet Squat Shoulder Press' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Gorilla Row' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Half Kneeling Diagonal KB Swing' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Half Kneeling Med Ball Slam' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Half Kneeling SA KB Press' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Half Kneeling Windmill KB' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Halo (Plate / KB / DB)' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'High Jump (RB Assisted)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'High Knees' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Hip Thrust (Single Leg)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'In and Out Squat' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Incline Push Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Inverted Row' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Jump Forward/Back (Line)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Jump Side-to-Side (+ RB)' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Kettlebell Swing' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Knee Push Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Knee to Low Squat' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Ladder / Cone Drills' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Landmine Lunge & Press' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Landmine Press' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Landmine Press & Jump to Lateral Lunge' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Landmine Rotation' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Landmine Squat & OH Press (L to R)' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Landmine T, Push + Rotation' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Lat Pulldown' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Lateral Bound to Lunge' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Lateral Bounds' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Lateral Step Over + Shadow DB' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Man Makers' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Marching Drill' AND br.slug = 'lower-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Mountain Climbers' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Offset OH Carry March' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Overhead Carry' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Overhead Triceps Extension' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Pallof Press (Standard / Chaos)' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Plank (Up-Down / Taps)' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Plank KB Pull-through' AND br.slug = 'core';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Plate Roll Up/Down' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Prone Shoulder Press (Block)' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Pull RB Down + March' AND br.slug = 'full-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Pull Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Push Press' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Push Up' AND br.slug = 'upper-body';
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = 'Quick Steps (Fwd/Bwd)' AND br.slug = 'lower-body';
