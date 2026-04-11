-- Lower-body exercises (gym location, body_regions.lower-body)

WITH loc AS (
  SELECT id FROM public.locations WHERE slug = 'gym' LIMIT 1
),
br AS (
  SELECT id FROM public.body_regions WHERE slug = 'lower-body' LIMIT 1
),
ins AS (
  INSERT INTO public.exercises (title, description, how_to, location_id)
  SELECT v.title, v.description, v.how_to, loc.id
  FROM loc,
  (VALUES
      ('In and Out Squat', 'Dynamic squat with a foot-switch.', 'Squat with feet wide, jump slightly and land with feet narrow, then squat again.'),
      ('Goblet / Sumo Squat', 'Weighted squat variations.', 'Goblet: Weight at chest. Sumo: Wide stance, toes out, weight hanging between legs.'),
      ('Squat Slam / Rotation', 'Squat with Med Ball power.', 'Slam: Explosive downward throw. Rotation: Twist torso while holding the ball at the bottom or top.'),
      ('Bulgarian Split Squat', 'Rear-foot elevated single-leg squat.', 'Place back foot on a bench; squat down on the front leg. Keep your torso upright or slightly leaned.'),
      ('Single Leg Box Squat', 'Controlled unilateral squat.', 'Stand on one leg in front of a box; sit back slowly until seated, then drive back up.'),
      ('Squat and Cable Push', 'Anti-rotational squat.', 'Hold a cable handle at your chest; squat, and as you stand, push the cable straight out.'),
      ('Knee to Low Squat', 'Transition from kneeling to squat.', 'Start on both knees; step one foot forward, then the other, staying in a deep catcher''s squat.'),
      ('Glute Bridge (Walk)', 'Glute isolation with stability.', 'Lie on back, hips up. Walk your feet out away from your body and back in while keeping hips high.'),
      ('Romanian Deadlift (RDL)', 'Focus on the eccentric (stretch).', 'Hinge at hips with a slight knee bend; lower weight until you feel a stretch in hamstrings, then squeeze glutes.'),
      ('Hip Thrust (Single Leg)', 'Maximum glute contraction.', 'Back on a bench; drive hips toward the ceiling. Use one leg to increase difficulty and core demand.'),
      ('Single Leg RDL', 'Balance and hinge combo.', 'Hinge forward on one leg while the other leg extends back like a seesaw. Keep hips level.'),
      ('Barbell Deadlift', 'Total body power.', 'Pull the bar from the floor, keeping it close to your shins and your back flat.'),
      ('3-Way / 5-Way Lunge', 'Multi-directional lunging.', 'Step into forward, lateral, and reverse lunges (3-way). Add diagonal angles for 5-way.'),
      ('Tennis Specific Lunges', 'Forehand/Volley/Backhand.', 'Perform a lunge while mimicking the swing/reach of a specific tennis stroke.'),
      ('Deficit Lunge', 'Increased range of motion.', 'Stand on a small plate or step; lunge backward off of it so the back knee goes lower than the floor level.'),
      ('Rev Lunge to Front Lunge', 'Fluid transition with rotation.', 'Step back into a lunge, then immediately swing that leg forward into a front lunge with a torso twist.'),
      ('Lateral Bound to Lunge', 'Lateral power to deceleration.', 'Leap sideways (bound) and land directly into a controlled lateral lunge.'),
      ('Box Drop Down (Hold/Jump)', 'Depth jumps for reactivity.', 'Step off a box; land softly in a squat (Hold) or immediately explode into a jump (Vertical/Broad).'),
      ('Box Step Up to Runner''s Pose', 'Stability and drive.', 'Step onto box; drive the opposite knee up high and hold a balanced running position.'),
      ('Skater Jump to SL Jump', 'Lateral to vertical power.', 'Leap sideways like a speed skater, then immediately jump vertically off that landing leg.'),
      ('High Jump (RB Assisted)', 'Over-speed vertical training.', 'Use a band anchored above you to pull you upward, allowing for a higher-than-normal jump.'),
      ('Elevated Clamshells', 'Glute medius activation.', 'Side-lying with hips lifted off the floor; open and close knees while keeping feet together.'),
      ('Crab Walks (Miniband)', 'Lateral hip stability.', 'Band around knees/ankles; stay in a partial squat and take small steps sideways.'),
      ('3D Wall Lean Calf Raise', 'Multi-angle ankle strength.', 'Lean against a wall; perform calf raises while shifting knees inward, centered, and outward.'),
      ('Tiptoe Walk (Lateral)', 'Ankle and arch stability.', 'Stay high on your toes; walk forward or sideways (with a band) without letting heels touch.'),
      ('Wall Sit Toe Raise', 'Tibialis (front of shin) work.', 'Lean against a wall in a squat; lift your toes toward your shins while keeping heels down.')
  ) AS v(title, description, how_to)
  RETURNING id
)
INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT ins.id, br.id, 0
FROM ins
CROSS JOIN br;
