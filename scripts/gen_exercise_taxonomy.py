#!/usr/bin/env python3
"""Emit SQL to repopulate exercise_*_links from title-based heuristics."""

# title -> body_region slug (single)
BODY: dict[str, str] = {}

# --- full body (20)
for t in [
    "Kettlebell Swing", "Single Arm KB Swing", "Landmine Lunge & Press",
    "Landmine Squat & OH Press (L to R)", "Landmine Rotation", "Landmine T, Push + Rotation",
    "Burpees", "Dumbbell Thruster", "Dumbbell Snatch", "Man Makers",
    "Goblet Squat Shoulder Press", "Goblet Squat Press + Rotation", "Pull RB Down + March",
    "Ball Slam Broad Jump", "Seated Squat + SA OH Press", "Lateral Step Over + Shadow DB",
    "Landmine Press & Jump to Lateral Lunge", "Split Stance Weighted Ball Circles",
    "Ball Slam on Knees", "Half Kneeling Med Ball Slam",
]:
    BODY[t] = "full-body"

# --- upper (34)
for t in [
    "Incline Push Up", "Knee Push Up", "3-way Knee Push Up", "Push Up", "3-way Push Up",
    "Assisted Push Up (RB)", "Dumbbell Bench Press (Single)", "Half Kneeling SA KB Press",
    "Shoulder Press", "Curls → Press → Dips", "Landmine Press", "Single Arm DB Press",
    "Explosive Push Up", "Push Press", "Overhead Triceps Extension", "Band Row", "Seated Row",
    "Lat Pulldown", "Single Arm Row", "Inverted Row", "Explosive Row", "Pull Up", "Gorilla Row",
    "Face Pull (+ Ext. Rotation)", "Band External Rotation", "Wall Slides", "Scapular Push Up",
    "Band Pull Apart", "YT Raises", "Overhead Carry", "Bottoms Up KB Carry",
    "Prone Shoulder Press (Block)", "Wrist Flexion/Extension", "Plate Roll Up/Down",
]:
    BODY[t] = "upper-body"

# --- lower (26)
for t in [
    "In and Out Squat", "Goblet / Sumo Squat", "Squat Slam / Rotation", "Bulgarian Split Squat",
    "Single Leg Box Squat", "Squat and Cable Push", "Knee to Low Squat", "Glute Bridge (Walk)",
    "Romanian Deadlift (RDL)", "Hip Thrust (Single Leg)", "Single Leg RDL", "Barbell Deadlift",
    "3-Way / 5-Way Lunge", "Tennis Specific Lunges", "Deficit Lunge", "Rev Lunge to Front Lunge",
    "Lateral Bound to Lunge", "Box Drop Down (Hold/Jump)", "Box Step Up to Runner's Pose",
    "Skater Jump to SL Jump", "High Jump (RB Assisted)", "Elevated Clamshells", "Crab Walks (Miniband)",
    "3D Wall Lean Calf Raise", "Tiptoe Walk (Lateral)", "Wall Sit Toe Raise",
]:
    BODY[t] = "lower-body"

# --- core (17)
for t in [
    "Dead Bug (DB / Ball Hold)", "Bird Dog (Standard / RB)", "Plank (Up-Down / Taps)",
    "Plank KB Pull-through", "Side Plank (Reach / Lift / Cable)", "Pallof Press (Standard / Chaos)",
    "Russian Twist", "Cable / Med Ball Rotation", "Around the World Slam",
    "Half Kneeling Diagonal KB Swing", "Half Kneeling Windmill KB", "Offset OH Carry March",
    "Mountain Climbers", "Bear Crawl (Static / Dynamic)", "Renegade Row",
    "Halo (Plate / KB / DB)", "Single Leg / Half Kneeling Halo",
]:
    BODY[t] = "core"

# --- footwork (19) — legs / locomotion
for t in [
    "Marching Drill", "Side Steps / Side Shuffle", "High Knees", "Carioca", "Ladder / Cone Drills",
    "Lateral Bounds", "Reactive Cone Drill", "Split Step and Hold", "Side Shuffle 1-2-1-3",
    "Quick Steps (Fwd/Bwd)", "Shadow Padel (+ RB)", "Jump Forward/Back (Line)", "Side Shuffle with RB",
    "Side Shuffle + Turn", "Crossover Steps (Line)", "Jump Side-to-Side (+ RB)", "Bosu Step Over Shadow",
    "Bosu Step Over DB Rot.", "Dribble to Bosu Lunge",
]:
    BODY[t] = "lower-body"

# category slugs: (title -> list)  footwork slug = footwork
CAT: dict[str, list[str]] = {}


def add_cat(title: str, *slugs: str) -> None:
    CAT[title] = list(slugs)


# Defaults by partition
for t, _ in BODY.items():
    if t in CAT:
        continue
    b = BODY[t]
    if b == "full-body":
        add_cat(t, "strength_explosive", "coordination", "conditioning")
    elif b == "upper-body":
        if any(x in t for x in ["Push Up", "Push-Up", "Press", "Extension", "Dip", "Curl"]):
            add_cat(t, "strength_hypertrofy", "strength_stability")
        elif "Row" in t or "Pull" in t or "Pulldown" in t:
            add_cat(t, "strength_hypertrofy", "strength_stability")
        elif any(x in t for x in ["Carry", "Halo", "Face Pull", "Rotation", "Band ", "Wall", "Scapular", "YT ", "Prone", "Wrist", "Plate"]):
            add_cat(t, "prehab", "strength_stability", "mobility")
        else:
            add_cat(t, "strength_hypertrofy", "strength_stability")
    elif b == "lower-body":
        if t in [
            "Marching Drill", "Side Steps / Side Shuffle", "High Knees", "Carioca", "Ladder / Cone Drills",
            "Reactive Cone Drill", "Split Step and Hold", "Side Shuffle 1-2-1-3", "Quick Steps (Fwd/Bwd)",
            "Shadow Padel (+ RB)", "Crossover Steps (Line)", "Side Shuffle with RB", "Side Shuffle + Turn",
        ]:
            add_cat(t, "footwork", "agility", "coordination", "sport-specific")
        elif "Bosu" in t or "Dribble" in t:
            add_cat(t, "footwork", "balance", "coordination", "sport-specific")
        elif any(x in t for x in ["Jump", "Bounds", "Skater", "Box Drop"]):
            add_cat(t, "strength_plyometric", "footwork", "agility")
        elif "Deadlift" in t or "RDL" in t:
            add_cat(t, "strength_maximalstrength" if "Barbell Deadlift" in t else "strength_hypertrofy", "strength_stability")
        elif "Squat" in t or "Lunge" in t or "Hip Thrust" in t or "Bridge" in t or "Clamshell" in t or "Crab" in t or "Wall Sit" in t or "Calf" in t or "Tiptoe" in t:
            add_cat(t, "strength_hypertrofy", "strength_stability", "mobility")
        else:
            add_cat(t, "strength_hypertrofy", "strength_stability")
    elif b == "core":
        if any(x in t for x in ["Twist", "Rotation", "Slam", "Swing", "Windmill", "Around the World"]):
            add_cat(t, "strength_explosive", "strength_stability", "sport-specific")
        elif "Mountain" in t or "Bear Crawl" in t:
            add_cat(t, "conditioning", "strength_stability", "coordination")
        else:
            add_cat(t, "strength_stability", "prehab", "mobility")

# Refinements
add_cat("Burpees", "conditioning", "strength_plyometric", "strength_explosive")
add_cat("Man Makers", "conditioning", "strength_hypertrofy", "coordination")
add_cat("Barbell Deadlift", "strength_maximalstrength", "strength_stability")
add_cat("Dumbbell Snatch", "strength_explosive", "strength_plyometric", "skill-based")
add_cat("Ball Slam Broad Jump", "strength_plyometric", "strength_explosive", "conditioning")
add_cat("High Jump (RB Assisted)", "strength_plyometric", "strength_speedstrength", "sport-specific")

# Movement patterns MP[title] = list of slugs
MP: dict[str, list[str]] = {}


def add_mp(title: str, *slugs: str) -> None:
    MP[title] = list(dict.fromkeys(slugs))  # dedupe preserve order


# Title-specific movement tags (comprehensive pass)
rows = list(BODY.keys())
for t in rows:
    tl = t.lower()
    mps: list[str] = []

    if t in BODY and BODY[t] == "lower-body" and t in CAT and "footwork" in CAT.get(t, []):
        if "split step" in tl:
            add_mp(t, "split-step", "gait", "land")
        elif "shuffle" in tl or "side step" in tl or "carioca" in tl or "crossover" in tl:
            add_mp(t, "shuffle", "lateral-movement", "change-of-direction")
        elif "march" in tl:
            add_mp(t, "gait", "reach")
        elif "high knee" in tl:
            add_mp(t, "sprint", "gait")
        elif "ladder" in tl or "cone" in tl or "reactive" in tl:
            add_mp(t, "change-of-direction", "reactive-footwork", "shuffle")
        elif "bound" in tl and "lunge" in tl:
            add_mp(t, "jump", "lunge", "land", "change-of-direction")
        elif "lateral bounds" == tl.strip():
            add_mp(t, "jump", "lateral-movement", "land")
        elif "quick step" in tl:
            add_mp(t, "gait", "shuffle", "sprint")
        elif "shadow" in tl:
            add_mp(t, "rotation", "lateral-movement", "open-stance-loading")
        elif "jump forward" in tl or "jump side" in tl:
            add_mp(t, "jump", "land", "lateral-movement")
        elif "bosu" in tl or "dribble" in tl:
            add_mp(t, "lunge", "rotation", "land", "single-leg-deceleration")
        elif "side shuffle" in tl and "rb" in tl:
            add_mp(t, "shuffle", "lateral-movement", "anti-rotation")
        elif "side shuffle + turn" in tl:
            add_mp(t, "shuffle", "rotation", "change-of-direction")
        else:
            add_mp(t, "shuffle", "gait", "lateral-movement")
        continue

    # squats / hinges / lunges
    if "squat" in tl and "push up" not in tl:
        if "deadlift" in tl or "rdl" in tl:
            add_mp(t, "hinge")
        elif "lunge" in tl or "split" in tl or "deficit" in tl:
            add_mp(t, "lunge", "squat", "single-leg-deceleration")
        elif "bridge" in tl or "thrust" in tl:
            add_mp(t, "bridge", "hinge")
        elif "jump" in tl or "bound" in tl or "skater" in tl or "box drop" in tl:
            add_mp(t, "jump", "land", "squat")
        elif "step up" in tl:
            add_mp(t, "lunge", "squat", "reach")
        elif "calf" in tl or "tiptoe" in tl or "wall sit" in tl:
            add_mp(t, "squat", "reach")
        elif "clam" in tl or "crab" in tl:
            add_mp(t, "lateral-movement", "anti-rotation")
        elif "cable push" in tl:
            add_mp(t, "squat", "push-horizontal", "anti-rotation")
        else:
            add_mp(t, "squat", "reach")
        continue

    if "push up" in tl or "push-up" in tl or tl == "push up":
        if "scapular" in tl:
            add_mp(t, "push-horizontal", "reach")
        elif "explosive" in tl:
            add_mp(t, "push-horizontal", "jump")
        elif "incline" in tl or "knee" in tl or "assisted" in tl:
            add_mp(t, "push-horizontal")
        else:
            add_mp(t, "push-horizontal", "plank", "anti-extension")
        continue

    if "row" in tl and "burpee" not in tl:
        if "inverted" in tl:
            add_mp(t, "pull-horizontal", "plank", "anti-extension")
        elif "renegade" in tl:
            add_mp(t, "pull-horizontal", "plank", "anti-rotation")
        elif "pulldown" in tl or "pull up" in tl:
            add_mp(t, "pull-vertical")
        elif "explosive" in tl:
            add_mp(t, "pull-horizontal", "rotation")
        elif "gorilla" in tl:
            add_mp(t, "pull-horizontal", "hinge")
        else:
            add_mp(t, "pull-horizontal")
        continue

    if "press" in tl and "shoulder" in tl and "prone" in tl:
        add_mp(t, "push-vertical", "reach")
    elif "shoulder press" in tl or "db press" in tl or "arm db press" in tl or "oh press" in tl.replace(" ", "") or "kb press" in tl:
        add_mp(t, "push-vertical", "overhead-support")
    elif "push press" in tl:
        add_mp(t, "push-vertical", "squat")
    elif "landmine press" == tl.strip() and "& jump" not in tl:
        add_mp(t, "push-vertical", "reach")
    elif "landmine press & jump" in tl:
        add_mp(t, "push-vertical", "jump", "lunge", "land")
    elif "bench press" in tl:
        add_mp(t, "push-horizontal")
    elif "thruster" in tl:
        add_mp(t, "squat", "push-vertical")
    elif "snatch" in tl:
        add_mp(t, "hinge", "push-vertical", "rotation")
    elif "curl" in tl:
        add_mp(t, "pull-horizontal", "push-vertical", "reach")
    elif "extension" in tl and "triceps" in tl:
        add_mp(t, "push-vertical")
    elif "dip" in tl:
        add_mp(t, "push-vertical", "reach")
    elif "face pull" in tl:
        add_mp(t, "pull-horizontal", "rotation")
    elif "band pull" in tl or "pull apart" in tl:
        add_mp(t, "pull-horizontal", "reach")
    elif "external rotation" in tl or "wall slide" in tl:
        add_mp(t, "rotation", "reach")
    elif "yt raise" in tl:
        add_mp(t, "reach", "rotation")
    elif "carry" in tl or "march" in tl and "pull rb" in tl:
        if "oh" in tl or "overhead" in tl or "offset" in tl:
            add_mp(t, "carry", "overhead-support", "gait")
        elif "bottoms up" in tl:
            add_mp(t, "carry", "overhead-support")
        elif "pull rb down" in tl:
            add_mp(t, "pull-vertical", "gait", "anti-extension")
        else:
            add_mp(t, "carry", "gait")
    elif "halo" in tl:
        add_mp(t, "rotation", "overhead-support")
    elif "wrist" in tl or "plate roll" in tl:
        add_mp(t, "reach")
    elif "dead bug" in tl:
        add_mp(t, "anti-extension", "reach", "anti-rotation")
    elif "bird dog" in tl:
        add_mp(t, "anti-rotation", "reach", "bridge")
    elif "plank" in tl:
        if "pull" in tl:
            add_mp(t, "plank", "anti-rotation", "pull-horizontal")
        elif "up-down" in tl or "tap" in tl:
            add_mp(t, "plank", "push-horizontal", "anti-rotation")
        else:
            add_mp(t, "plank", "anti-extension")
    elif "side plank" in tl:
        add_mp(t, "plank", "anti-rotation", "lateral-movement")
    elif "pallof" in tl:
        add_mp(t, "anti-rotation", "push-horizontal")
    elif "russian twist" in tl:
        add_mp(t, "rotation", "twist")
    elif "cable / med ball" in tl.lower() or "med ball rotation" in tl:
        add_mp(t, "rotation", "rotational-transfer")
    elif "around the world" in tl:
        add_mp(t, "rotation", "throw")
    elif "half kneeling diagonal" in tl:
        add_mp(t, "rotation", "hinge", "throw")
    elif "windmill" in tl:
        add_mp(t, "rotation", "hinge", "overhead-support")
    elif "mountain climber" in tl:
        add_mp(t, "plank", "sprint", "anti-extension")
    elif "bear crawl" in tl:
        add_mp(t, "crawl", "anti-extension", "reach")
    elif "kettlebell swing" in tl or "kb swing" in tl:
        add_mp(t, "hinge", "throw", "rotation")
    elif "landmine" in tl:
        if "lunge" in tl:
            add_mp(t, "lunge", "push-vertical", "rotation")
        elif "rotation" in tl or "t, push" in tl:
            add_mp(t, "rotation", "push-horizontal", "rotational-transfer")
        elif "squat" in tl:
            add_mp(t, "squat", "push-vertical", "rotation")
        else:
            add_mp(t, "rotation", "push-horizontal")
    elif "burpees" in tl:
        add_mp(t, "push-horizontal", "jump", "squat")
    elif "man maker" in tl:
        add_mp(t, "plank", "pull-horizontal", "squat", "push-vertical")
    elif "goblet squat press" in tl:
        add_mp(t, "squat", "push-vertical", "rotation")
    elif "goblet squat shoulder" in tl:
        add_mp(t, "squat", "push-vertical")
    elif "ball slam" in tl or "slam broad" in tl:
        add_mp(t, "throw", "squat", "jump")
    elif "lateral step over" in tl:
        add_mp(t, "lunge", "rotation", "shuffle")
    elif "split stance weighted" in tl:
        add_mp(t, "rotation", "lunge", "reach")
    elif "seated squat" in tl:
        add_mp(t, "squat", "push-vertical")
    elif "med ball slam" in tl and "half kneeling" in tl:
        add_mp(t, "throw", "rotation", "lunge")
    else:
        add_mp(t, "reach", "squat")

# Verify coverage
missing_mp = [t for t in BODY if t not in MP]
missing_cat = [t for t in BODY if t not in CAT]
assert not missing_cat, missing_cat
assert not missing_mp, missing_mp


def esc(s: str) -> str:
    return s.replace("'", "''")


def emit() -> None:
    print("BEGIN;")
    print("TRUNCATE TABLE public.exercise_body_region_links;")
    print("TRUNCATE TABLE public.exercise_category_type_links;")
    print("TRUNCATE TABLE public.exercise_movement_pattern_links;")
    print()

    for title, slug in sorted(BODY.items()):
        print(
            f"""INSERT INTO public.exercise_body_region_links (exercise_id, body_region_id, sort_order)
SELECT e.id, br.id, 0 FROM public.exercises e
CROSS JOIN public.body_regions br
WHERE e.title = '{esc(title)}' AND br.slug = '{slug}';"""
        )

    so = 0
    for title in sorted(CAT):
        for i, cslug in enumerate(CAT[title]):
            print(
                f"""INSERT INTO public.exercise_category_type_links (exercise_id, exercise_category_type_id, sort_order)
SELECT e.id, c.id, {i} FROM public.exercises e
CROSS JOIN public.exercise_category_types c
WHERE e.title = '{esc(title)}' AND c.slug = '{cslug}';"""
            )

    for title in sorted(MP):
        for i, mslug in enumerate(MP[title]):
            print(
                f"""INSERT INTO public.exercise_movement_pattern_links (exercise_id, movement_pattern_id, sort_order)
SELECT e.id, m.id, {i} FROM public.exercises e
CROSS JOIN public.movement_patterns m
WHERE e.title = '{esc(title)}' AND m.slug = '{mslug}';"""
            )

    print("COMMIT;")


if __name__ == "__main__":
    emit()
