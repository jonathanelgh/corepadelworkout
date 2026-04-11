-- Core exercises (gym location, body_regions.core)

WITH loc AS (
  SELECT id FROM public.locations WHERE slug = 'gym' LIMIT 1
),
br AS (
  SELECT id FROM public.body_regions WHERE slug = 'core' LIMIT 1
),
ins AS (
  INSERT INTO public.exercises (title, description, how_to, location_id)
  SELECT v.title, v.description, v.how_to, loc.id
  FROM loc,
  (VALUES
      ('Dead Bug (DB / Ball Hold)', 'Deep core and ribcage control.', 'Lie on your back; press your low back into the floor. Lower opposite arm/leg while holding a DB or squeezing a med ball.'),
      ('Bird Dog (Standard / RB)', 'Posterior chain and cross-body stability.', 'On all fours, extend opposite arm and leg. Use a Resistance Band (RB) around the foot/hand to add tension.'),
      ('Plank (Up-Down / Taps)', 'Dynamic shoulder and core stability.', 'Up-Down: Move from elbows to hands. Taps: In high plank, tap opposite shoulder without shifting your hips.'),
      ('Plank KB Pull-through', 'Anti-rotational core strength.', 'In high plank, reach under your body to pull a kettlebell from one side to the other.'),
      ('Side Plank (Reach / Lift / Cable)', 'Lateral chain (Obliques/Glute Med).', 'Reach Under: Rotate chest toward the floor. Leg Lift: Raise top leg. Cable Pull: Face a machine and pull the cable while side planking.'),
      ('Pallof Press (Standard / Chaos)', 'The ultimate anti-rotation move.', 'Hold a cable/band at chest height; press it forward. Chaos: Have a partner tap the band or use a weighted plate to create shaking.'),
      ('Russian Twist', 'Rotational endurance.', 'Sit with heels off the floor; rotate a weight from hip to hip while keeping the chest tall.'),
      ('Cable / Med Ball Rotation', 'Power in the transverse plane.', 'Use your hips and core to rotate the weight/ball. Forehand/Backhand: Mimic the specific swing paths of tennis.'),
      ('Around the World Slam', 'Circular power and coordination.', 'Swing the ball in a big circle over your head and slam it hard to the side of your body.'),
      ('Half Kneeling Diagonal KB Swing', 'Multi-planar hip and core drive.', 'Kneeling on one knee, swing the KB from the bottom hip diagonally across to the opposite shoulder.'),
      ('Half Kneeling Windmill KB', 'Thoracic mobility and shoulder stability.', 'Hold KB overhead; hinge at the hip to touch the floor with your free hand while looking at the weight.'),
      ('Offset OH Carry March', 'Asymmetrical vertical stability.', 'Hold a weight overhead on one side only; march in place while keeping your torso perfectly vertical.'),
      ('Mountain Climbers', 'High-intensity core and hip flexors.', 'In high plank, run your knees toward your chest as fast as possible without bouncing your hips.'),
      ('Bear Crawl (Static / Dynamic)', 'Full body coordination and core.', 'Static: Hold knees 2 inches off floor on all fours. Dynamic: Crawl forward/back. Miniband: Tap hands out to the side against band tension.'),
      ('Renegade Row', 'Combined plank and pull.', 'In a high plank with hands on DBs, row one weight to your hip at a time. Do not let your hips tilt!'),
      ('Halo (Plate / KB / DB)', '360-degree shoulder and core stability.', 'Circle the weight around your head like a halo, keeping it close to your neck.'),
      ('Single Leg / Half Kneeling Halo', 'Reduced base of support.', 'Perform the halo while standing on one leg or kneeling to force the core to work harder for balance.')
  ) AS v(title, description, how_to)
  RETURNING id
)
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT ins.id, br.id, 0
FROM ins
CROSS JOIN br;
