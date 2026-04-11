-- Footwork drills: gym location + exercise_category_types.footwork

WITH loc AS (
  SELECT id FROM public.locations WHERE slug = 'gym' LIMIT 1
),
cat AS (
  SELECT id FROM public.exercise_category_types WHERE slug = 'footwork' LIMIT 1
),
ins AS (
  INSERT INTO public.exercises (title, description, how_to, location_id)
  SELECT v.title, v.description, v.how_to, loc.id
  FROM loc,
  (VALUES
      ('Marching Drill', 'Foundation for sprinting mechanics.', 'Drive knees up to hip height with toes pulled up; pump opposite arms rhythmically.'),
      ('Side Steps / Side Shuffle', 'Lateral court coverage.', 'Stay low in an athletic stance; push off the trailing leg to glide sideways. Do not cross feet.'),
      ('High Knees', 'Speed and hip flexor drive.', 'Run in place with rapid knee turnover, hitting hip height with every rep.'),
      ('Carioca', 'Lateral coordination and hip mobility.', 'Move sideways by crossing one foot in front of the other, then behind, in a rhythmic pattern.'),
      ('Ladder / Cone Drills', 'Footwork precision and speed.', 'Perform various patterns (e.g., in-and-out, Ickey Shuffle) through an agility ladder or cones.'),
      ('Lateral Bounds', 'Explosive side-to-side power.', 'Leap laterally from one foot to the other, landing softly in a loaded, athletic position.'),
      ('Reactive Cone Drill', 'Cognitive and physical agility.', 'Have a partner call out colors/numbers of cones to sprint to, forcing a rapid change of direction.'),
      ('Split Step and Hold', 'Core Padel/Tennis mechanic.', 'Small hop as the opponent strikes the ball; land in a wide stance, ready to react. Hold to check balance.'),
      ('Side Shuffle 1-2-1-3', 'Variable rhythm lateral work.', 'Shuffle one step, then two, then three; mimicking the stop-and-start nature of a rally.'),
      ('Quick Steps (Fwd/Bwd)', 'Linear acceleration and braking.', 'Short, choppy steps moving forward 5m, then back-pedaling quickly to the start.'),
      ('Shadow Padel (+ RB)', 'Technical movement simulation.', 'Move through specific shots (smash, bandeja, volley) without a ball. Add an RB around the waist for resistance.'),
      ('Jump Forward/Back (Line)', 'Linear plyometric speed.', 'Hop rapidly over a line or elastic band. Keep ground contact time as short as possible.'),
      ('Side Shuffle with RB', 'Resisted lateral movement.', 'Perform a shuffle with a band around ankles or knees to fire the glute medius and hip stabilizers.'),
      ('Side Shuffle + Turn', 'Directional change under tension.', 'Shuffle laterally with a band, then pivot 180 degrees to shuffle back, maintaining tension.'),
      ('Crossover Steps (Line)', 'Lateral agility and foot speed.', 'Step over a line laterally, crossing the outside foot over the inside foot rapidly.'),
      ('Jump Side-to-Side (+ RB)', 'Lateral plyometric speed.', 'Rapid ski jumps over a line. The RB increases the force needed to clear the line and stabilize.'),
      ('Bosu Step Over Shadow', 'Stability-based agility.', 'Step laterally across a Bosu ball (dome side up) and perform a shadow padel stroke at the edge.'),
      ('Bosu Step Over DB Rot.', 'Weighted stability work.', 'Step over the Bosu; as you land, rotate a DB across your body to simulate a loaded stroke.'),
      ('Dribble to Bosu Lunge', 'Coordination and deceleration.', 'Dribble a ball (or move quickly) toward a Bosu, then step onto it into a controlled lunge.')
  ) AS v(title, description, how_to)
  RETURNING id
)
INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT ins.id, cat.id, 0
FROM ins
CROSS JOIN cat;
