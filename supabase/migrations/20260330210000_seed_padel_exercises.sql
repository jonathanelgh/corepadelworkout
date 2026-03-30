-- 25 padel-specific exercises (no media; add video/image in admin later).
-- Idempotent: skips rows that already exist with the same title.

insert into public.exercises (title, description, how_to, location_id, video_url, image_url)
select v.title, v.description, v.how_to, l.id, null::text, null::text
from (
  values
    (
      'Lateral skater hops',
      'Short, explosive side-to-side hops that mirror recovering wide balls on the padel court. Builds lateral power and ankle stiffness for quick changes of direction.',
      E'Start on one leg in a slight squat.\n\nHop sideways to the opposite leg; land softly with knee and hip flexed, chest tall.\n\nTouch the floor lightly with your free hand if balance allows, then immediately hop back.\n\nKeep strides controlled (1–1.5 m). Do 3 sets of 8–12 contacts per side; rest 60 s between sets.',
      'at-the-court'
    ),
    (
      'Split squat (rear foot elevated)',
      'Single-leg strength pattern similar to lunging into a low volley or defensive squat. Emphasizes quads, glutes, and hip stability on the front leg.',
      E'Place your rear foot on a low bench or step; front foot far enough forward that you can keep torso tall.\n\nLower straight down until your back knee nearly touches the floor.\n\nDrive up through the front mid-foot; avoid collapsing the front knee inward.\n\n3 sets of 8–12 reps per leg; use bodyweight first, then hold dumbbells if available.',
      'gym'
    ),
    (
      'Pallof press (anti-rotation)',
      'Anti-rotation core work that supports a stable trunk when you hit bandejas, víboras, and defensive lobs without leaking power through the torso.',
      E'Attach a band or cable at chest height, stand sideways to the anchor.\n\nHold the handle at your sternum, brace your ribs down slightly, feet shoulder-width.\n\nPress the handle straight out until arms are extended; resist rotation toward the anchor.\n\nPause 1–2 s, return smoothly. 3 sets of 10–15 reps per side. Exhale on the press.',
      'gym'
    ),
    (
      'Single-leg Romanian deadlift',
      'Hip-hinge on one leg to strengthen hamstrings and glutes for decelerating into shots and protecting the lower back during deep reaches.',
      E'Stand on one leg with a soft bend in the knee; slight bend stays fixed.\n\nHinge at the hip, reaching the free leg back as the torso lowers toward the floor.\n\nStop when you feel a strong hamstring stretch; keep hips square (don''t open to the side).\n\nDrive through the standing heel to stand tall. 3 sets of 6–10 slow reps per leg.',
      'home'
    ),
    (
      'Copenhagen side plank (adductor)',
      'Targets the inner thigh and adductors, which work hard during lateral pushes and wide defensive slides on glass-side recoveries.',
      E'Lie on your side; top leg rests on a bench or chair edge, bottom leg free below.\n\nLift your hips so your body forms a straight line from head to knees.\n\nHold 20–40 s; keep bottom shoulder stacked. Repeat on both sides.\n\nRegression: shorter hold or keep bottom knee on the floor.',
      'home'
    ),
    (
      'Banded external rotation (shoulder health)',
      'Reinforces the rotator cuff and scapular control to balance heavy forehand and backhand volumes and reduce overload at the elbow.',
      E'Anchor a light band at elbow height; elbow pinned to your ribs, forearm across your belly.\n\nRotate the forearm outward against the band without shrugging the shoulder.\n\nMove slowly: 2 s out, 2 s in. 2–3 sets of 12–20 reps per arm.\n\nStop if you feel sharp pain; keep range pain-free.',
      'home'
    ),
    (
      'Squat jump with lateral stick landing',
      'Trains landing mechanics after explosive work—useful after smash approaches or quick defensive scrambles.',
      E'Start in an athletic quarter squat.\n\nJump vertically or slightly diagonally; land on one foot or both as programmed.\n\nOn landing, flex hips and knees to absorb force and hold a stable stick landing for 1–2 s (no wobble).\n\n3 sets of 4–6 reps; quality over height.',
      'gym'
    ),
    (
      'Lunge matrix (forward / lateral / reverse)',
      'Multi-directional lunges map to stepping patterns you use closing the net, recovering wide, and rotating out of corners.',
      E'Perform one static lunge each: forward, lateral (same side leg leading), and reverse (45° back).\n\nKeep front knee tracking over the foot; torso tall.\n\nCycle both legs. 2–3 rounds of 3 lunges per direction per leg.\n\nAdd a light torso rotation away from the front knee to bias trunk mobility if desired.',
      'home'
    ),
    (
      'Dead bug',
      'Teaches rib–pelvis control so low-back extension does not compensate during overhead shots and tough reaches.',
      E'Lie on your back; hips and knees at 90°, arms aimed at the ceiling.\n\nFlatten lower back gently toward the floor; maintain that pressure.\n\nSlowly lower opposite arm and leg toward the floor; stop before back arches.\n\nReturn and switch. 3 sets of 8–10 slow reps per side.',
      'home'
    ),
    (
      'Side plank with reach-through',
      'Combines lateral core strength with controlled rotation—similar to trunk demands on cut shots and off-balance volleys.',
      E'Set up in a side plank on forearm; feet stacked or staggered.\n\nReach your top arm under your body, rotate slightly, then open back to a T-shape.\n\nHips stay high; no dumping forward. 2–3 sets of 6–10 reaches per side.',
      'home'
    ),
    (
      'Wall sit isometric',
      'Builds fatigue resistance in the quads for prolonged low defensive positions and repeated split steps.',
      E'Back flat against a wall; walk feet forward until knees reach roughly 90°.\n\nPress knees gently outward to track over feet.\n\nHold 30–60 s, 3 rounds; breathe steadily.\n\nSlide higher on the wall if knees bother you.',
      'home'
    ),
    (
      'Calf raises (straight and bent knee)',
      'Ankle and soleus strength for repeated small hops, split steps, and stable landings on hard padel surfaces.',
      E'Straight-leg raises: rise onto the balls of both feet, pause 1 s, lower over 2 s. 2–3 sets of 12–20.\n\nBent-knee (small squat) raises: same motion emphasizing soleus; 2 sets of 15–25.\n\nUse a wall for balance; add a backpack for load when easy.',
      'at-the-court'
    ),
    (
      'Broad jump to stable landing',
      'Horizontal power and braking strength for covering deep lobs and attacking short balls with control.',
      E'Start in an athletic stance; swing arms naturally.\n\nJump forward for distance; land with feet roughly hip-width, soft hips and knees.\n\nHold the landing 2 s without extra steps.\n\n4–6 jumps per set, 3 sets; walk back for recovery.',
      'gym'
    ),
    (
      'Hip airplane (controlled)',
      'Single-leg balance with a hip hinge improves stability on one leg during stretched volleys and bandeja setups.',
      E'Stand on one leg; slight knee bend on the standing leg.\n\nHinge forward until torso is near parallel; back leg extends as a counterbalance.\n\nOpen hips slightly toward the floor, then square hips to close the rep.\n\nMove slowly—3–5 reps per leg for quality. Use a fingertip on a wall if needed.',
      'home'
    ),
    (
      'Drop-step reactive starts',
      'Short acceleration bursts from a ready stance mimic reacting to serves and fast blocks at the net.',
      E'Use lines or cones 5–8 m apart. Start in a ready position: knees soft, weight on the balls of the feet.\n\nOn a self-cue or partner clap, push off and sprint to the first marker; decelerate under control.\n\nWalk back; alternate lead foot. 6–10 reps per session.',
      'at-the-court'
    ),
    (
      'Wrist extensor eccentric (table edge)',
      'Low-load tendon-care work often used to build tolerance in the common extensor mass after high racket volumes.',
      E'Forearm resting on a table; wrist off the edge, palm facing down.\n\nUse the other hand to lift the wrist upward passively.\n\nLower the working wrist slowly over 3–4 s using only the working muscles.\n\n2–3 sets of 10–15 reps; stay well shy of sharp pain.',
      'home'
    ),
    (
      'Thoracic open book',
      'Improves mid-back rotation so the shoulder does not have to compensate during long backhand reaches.',
      E'Lie on your side; hips and knees bent 90°; arms stacked at shoulder height.\n\nLift the top arm in an arc, rotating your chest open toward the ceiling.\n\nFollow your hand with your eyes; keep the bottom knee pinned down.\n\n8–10 slow reps per side; exhale as you open.',
      'home'
    ),
    (
      'Glute bridge march',
      'Glutes and hamstrings hold pelvic position—helps drive hip extension in sprints to the ball and stable finishes.',
      E'Lie on your back; feet hip-width, knees bent.\n\nBridge until hips are extended; ribs stay soft (do not flare).\n\nLift one foot a few centimeters and hold 2–3 s; place it down, switch legs.\n\nAlternate for 30–45 s per set, 3 sets.',
      'home'
    ),
    (
      'Mini-band lateral walks',
      'Wakes up glute medius for lateral coverage and keeps knees from collapsing during quick side shuffles.',
      E'Place a mini-band just above knees or around mid-foot.\n\nAthletic quarter squat; step sideways without dragging the trailing foot or rocking the torso.\n\n10–15 steps each direction counts as one set; 2–3 sets.\n\nNo band? Practice the same pattern with a sliding towel on one foot.',
      'gym'
    ),
    (
      'Plank shoulder taps',
      'Shoulder and trunk stability in an extended position—similar to loading through the arms in low volleys and defensive digs.',
      E'High plank; hands under shoulders, body rigid from head to heels.\n\nTap opposite shoulder with minimal hip rotation—imagine holding glasses of water on your low back.\n\nSlow tempo: alternate taps for 30–45 s. Rest; 3 rounds.',
      'home'
    ),
    (
      'Quick feet on the line',
      'Low-amplitude foot-fire in place supports a crisp split step and fast adjustments behind the ball.',
      E'Stand on a court line or tape at home.\n\nRapid small steps, landing on the balls of the feet; keep hips quiet.\n\nWork blocks of 5–10 s hard, 20–30 s easy; 6–10 blocks.\n\nStay relaxed in shoulders—no white-knuckle tension.',
      'at-the-court'
    ),
    (
      'Reverse Nordic (hamstring eccentric)',
      'Knee-flexion emphasis strengthens hamstrings as they lengthen—useful for sprinting, braking, and protecting the knee in lunges.',
      E'Kneel on a mat with feet anchored (partner or fixed furniture).\n\nKeep hips extended; lower toward the floor as slowly as possible (4–6 s).\n\nCatch yourself with hands if needed and reset.\n\n3–5 controlled reps, 2–3 sets. Skip if kneeling hurts.',
      'gym'
    ),
    (
      'Rotational med-ball chest pass (wall)',
      'Develops hip-to-hand sequencing for rotational shots without overloading the elbow if you keep the load moderate.',
      E'Stand sideways to a sturdy wall; hold a light ball at the sternum.\n\nRotate hips and torso together, then release the ball into the wall with both hands.\n\nCatch softly and reset. 2–3 sets of 8–12 reps per side.\n\nIf no ball, practice the same sequence slowly without release.',
      'gym'
    ),
    (
      'Single-arm farmer carry',
      'Loaded carries challenge lateral core bracing—similar to staying tall while moving with the racket on one side.',
      E'Hold a heavy dumbbell or bag in one hand; stand tall, ribs stacked over pelvis.\n\nWalk 20–40 m without leaning away from the weight.\n\nSwitch hands each lap. 3–4 laps per side.\n\nKeep shoulders relaxed; gaze forward.',
      'gym'
    ),
    (
      'Split-step practice (shadow)',
      'Grooves timing of the hop-step landing so you land loaded as the opponent contacts the ball.',
      E'On a self-count or partner toss signal, perform a small hop, landing on both feet with knees soft.\n\nImmediately shadow a ready first step toward a labeled direction (forehand/backhand).\n\nRepeat 15–20 clean reps; prioritize timing over height.',
      'at-the-court'
    )
) as v(title, description, how_to, location_slug)
join public.locations l on l.slug = v.location_slug
where not exists (
  select 1 from public.exercises e where e.title = v.title
);
