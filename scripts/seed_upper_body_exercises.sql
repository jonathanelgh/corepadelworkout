-- One-shot seed: upper-body exercises (gym location). Applied via Supabase MCP / SQL editor.

WITH loc AS (
  SELECT id FROM public.locations WHERE slug = 'gym' LIMIT 1
),
br AS (
  SELECT id FROM public.body_regions WHERE slug = 'upper-body' LIMIT 1
),
ins AS (
  INSERT INTO public.exercises (title, description, how_to, location_id)
  SELECT v.title, v.description, v.how_to, loc.id
  FROM loc,
  (VALUES
    ('Incline Push Up', 'Easier push-up variation using an elevated surface.', 'Place hands on a bench or bar; lower your chest to the edge and push back up.'),
    ('Knee Push Up', 'Modified push-up to reduce weight load.', 'Keep knees on the floor, maintain a straight line from head to knees, and lower chest to floor.'),
    ('3-way Knee Push Up', 'Multi-angle chest engagement on knees.', 'Perform reps with hands in three positions: wide, standard, and narrow (diamond).'),
    ('Push Up', 'Standard bodyweight horizontal press.', 'Maintain a rigid plank; lower until chest nearly touches the floor, elbows at 45 degrees.'),
    ('3-way Push Up', 'Advanced multi-angle chest engagement.', 'Perform standard push-ups cycling through wide, narrow, and staggered hand placements.'),
    ('Assisted Push Up (RB)', 'Band-assisted horizontal press.', 'Loop a resistance band around a rack; place it under your hips/chest to help pull you up.'),
    ('Dumbbell Bench Press (Single)', 'Unilateral chest press for core stability.', 'Lie on a bench; press one DB while keeping your torso flat and resisting the lopsided weight.'),
    ('Half Kneeling SA KB Press', 'Shoulder press focusing on hip/core stability.', 'One knee down; press the KB overhead with the opposite arm. Keep ribs tucked.'),
    ('Shoulder Press', 'Vertical press for deltoid strength.', 'Press DBs or a barbell from shoulder height to full lockout overhead.'),
    ('Curls → Press → Dips', 'High-volume DB complex.', 'Curl DBs, press them overhead, then transition to a bench or chair for tricep dips.'),
    ('Landmine Press', 'Angled press that is easier on the shoulder joint.', 'Stand at the end of the bar; press it forward and up at a 45-degree angle.'),
    ('Single Arm DB Press', 'Unilateral vertical press.', 'Stand or sit; press one DB overhead while keeping the rest of the body still.'),
    ('Explosive Push Up', 'Plyometric power movement.', 'Push up with enough force that your hands leave the floor. Land softly.'),
    ('Push Press', 'Leg-assisted overhead press.', 'Use a slight "dip" in the knees to drive momentum into a heavy overhead press.'),
    ('Overhead Triceps Extension', 'Isolation for the long head of the tricep.', 'Hold a cable or DB behind your head; extend your arms fully toward the ceiling.'),
    ('Band Row', 'Horizontal pull using elastic resistance.', 'Secure a band to a post; pull handles toward your ribcage, squeezing shoulder blades.'),
    ('Seated Row', 'Fundamental horizontal pull.', 'On a machine or with bands, pull weight toward your waist while keeping a tall spine.'),
    ('Lat Pulldown', 'Vertical pull for back width.', 'Pull the bar down to your upper chest; focus on driving elbows toward your pockets.'),
    ('Single Arm Row', 'Unilateral pull for back thickness.', 'Support yourself on a bench; pull the DB toward your hip, keeping the elbow close.'),
    ('Inverted Row', 'Bodyweight horizontal pull.', 'Under a bar or TRX, pull your chest up to the bar while keeping your body in a straight line.'),
    ('Explosive Row', 'Power-focused horizontal pull.', 'Perform a row with maximum speed on the concentric (pulling) phase.'),
    ('Pull Up', 'Elite bodyweight vertical pull.', 'Hang from a bar; pull until your chin is over the bar. Avoid excessive swinging.'),
    ('Gorilla Row', 'Heavy alternating row from the floor.', 'Hinge over two KBs; row one at a time while the other stays on the floor for support.'),
    ('Face Pull (+ Ext. Rotation)', 'Rear delt and rotator cuff health.', 'Pull a rope toward your forehead; at the end, pull your hands apart and rotate back.'),
    ('Band External Rotation', 'Rotator cuff isolation.', 'Elbow at 90° tucked to side; rotate your hand away from your body against band tension.'),
    ('Wall Slides', 'Scapular mobility and posture.', 'Back against wall; slide arms up and down in a ''W'' shape without losing wall contact.'),
    ('Scapular Push Up', 'Serratus anterior activation.', 'In a plank, move only your shoulder blades together and apart without bending elbows.'),
    ('Band Pull Apart', 'Posture and rear delt activation.', 'Hold a band with straight arms; pull it across your chest by squeezing shoulder blades.'),
    ('YT Raises', 'Lower trap and overhead mobility.', 'Lie face down; raise arms in a ''Y'' shape, then a ''T'' shape to hit different back fibers.'),
    ('Overhead Carry', 'Total body and shoulder stability.', 'Walk while holding a weight (DB/KB) locked out overhead. Keep core tight.'),
    ('Bottoms Up KB Carry', 'Advanced grip and shoulder stability.', 'Hold a KB upside down (handle in hand, bell in air); walk while keeping it balanced.'),
    ('Prone Shoulder Press (Block)', 'End-range shoulder mobility.', 'Lie face down, forehead on a block; perform a pressing motion with hands off the floor.'),
    ('Wrist Flexion/Extension', 'Forearm strength.', 'Rest forearm on a bench; curl the DB up (flexion) or lift the back of hand up (extension).'),
    ('Plate Roll Up/Down', 'Grip and forearm endurance.', 'Roll a weighted plate up and down a string attached to a handle using wrist rotation.')
  ) AS v(title, description, how_to)
  RETURNING id
)
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT ins.id, br.id, 0
FROM ins
CROSS JOIN br;
