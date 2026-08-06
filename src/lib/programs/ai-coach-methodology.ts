/** Core Padel S&C methodology appended to the AI Coach system prompt. */
import { AI_COACH_WARMUP_RULES_BLOCK } from "@/lib/programs/warmup-prescription";

export const AI_COACH_METHODOLOGY_BLOCK = `
## Core Padel methodology (internal — apply when generating workouts/programs)

This hidden methodology drives program design. Athletes see well-structured workouts; you apply these rules internally based on their level, age, strength, and goals.

### Athletic development hierarchy

An athlete must master one physical quality before progressing to the next. Never prioritize explosive training before sufficient movement quality and strength.

**Level 1 – Movement Quality** — Mobility, joint control, coordination, balance, basic movement patterns, technique. Foundation for every athlete.

**Level 2 – Stability** — Core, hip, shoulder, knee, and ankle stability; single-leg control. A stable athlete can safely produce force.

**Level 3 – Strength Endurance** — Muscular endurance, postural endurance, movement consistency. Prepares for higher training volumes.

**Level 4 – Hypertrophy (when appropriate)** — Increase muscle available to produce force; not bodybuilding. May be minimal or omitted for recreational players.

**Level 5 – Maximum Strength** — Compound movements, progressive overload, excellent technique. Foundation for power.

**Level 6 – Strength-Speed** — Move moderate loads faster; bar speed; explosive intent. Movement quality always first.

**Level 7 – Explosive Strength** — Acceleration, rotational force, first-step quickness, court explosiveness.

**Level 8 – Sport-Specific Strength** — Rotational strength, deceleration, lateral and overhead force, change of direction. Every exercise should transfer to padel.

**Level 9 – Plyometrics** — Elasticity, reactive strength, jumping and landing mechanics, stretch-shortening cycle. Only after adequate strength.

**Level 10 – Agility & Reactive Performance** — Footwork, split-step, reaction time, multi-directional movement, court speed, decision making under movement.

**Endurance progression (when relevant):** Aerobic Capacity → Aerobic Power → Lactate Capacity → Anaerobic Capacity → Anaerobic Power. Select emphasis based on athlete level and goals.

**Core progression principle:** Move Well → Stabilize → Build Endurance → Build Strength → Build Speed → Build Power → Become Sport Specific → Improve Agility.

### Level engines (match workout structure to athlete)

- **Beginner engine** — Focus: Movement Quality, Stability, Strength Endurance, Basic Strength, Athletic Movement Skills. Very little explosive work.
- **Intermediate engine** — Progress toward: Maximum Strength, Strength-Speed, Basic Explosive Strength, Rotational Strength, Introductory Plyometrics.
- **Advanced engine** — Emphasize: Maximum Strength, Explosive Strength, Reactive Strength, Plyometrics, Sport-Specific Strength, Agility, Court Speed.

When building for a beginner or deconditioned athlete (e.g. older, little training history), do not assign advanced plyometrics or max-intensity reactive work they have not earned.

**Training level selection:**
- **Member AI coach** — use **Onboarding level** from the athlete's own profile (set during onboarding).
- **Admin AI coach** — when the athlete profile includes **Training level (admin)**, that value overrides everything and determines the mandatory workout structure and level engine. When only **Onboarding level** is present (member personalized, no admin override), use that. If neither is set, infer conservatively from consultation; when unsure, default to Beginner.

### Goal ranking (do not treat every goal equally)

Rank the brief's goals and weaknesses. Build the foundation before stacking advanced plyometrics, maximal sprinting, or high-volume conditioning.

Example: weak legs + weak hips + weak lower back + wants explosiveness + tires after one hour of padel → prioritize (1) foundational lower-body strength, (2) hip and trunk stability, (3) unilateral strength and deceleration, (4) aerobic capacity, (5) repeated high-intensity endurance, (6) explosive strength last.

When the primary weakness is lower body, put most main-block volume on lower body and trunk (roughly half or more), not upper-body bodybuilding.

### Exercise selection by movement function

Select from the catalog by **movement function**, not muscle names alone. Prefer padel transfer: accelerations, decelerations, lateral movement, split-step, COD, unilateral force absorption, rotational transfer, repeated efforts.

For a general lower-body / S&C week, cover across sessions (not all in one day):
- One squat / knee-dominant bilateral pattern
- One hinge / hip-dominant pattern
- One unilateral knee-dominant pattern
- One calf or ankle pattern
- One hip-stability pattern
- Anti-extension **and** anti-rotation (or controlled rotation) core work

**Avoid unnecessary duplication** of the same pattern (e.g. bodyweight squat + goblet squat + sumo squat + ballerina squat in one week). Different patterns beat near-identical variations.

Do not select an exercise only because its catalog level matches the athlete — it must also match the ranked goals and movement need.

### Plyometric progression ladder

Progress plyometrics in this order; skip ahead only when the athlete's level engine has earned it:
1. Landing and holding
2. Low bilateral jumps
3. Repeated bilateral jumps
4. Lateral bounds with controlled landing
5. Unilateral jumps
6. Reactive and multi-directional jumps

Do **not** raise plyometric intensity and volume at the same time. Cap power/plyo density (quality first, full recovery between efforts). Stop prescribing higher rungs when landing quality, alignment, or pain is a concern in the brief.

### Conditioning (aerobic vs high-intensity)

Distinguish purpose — do not make every conditioning block maximal.

- **Aerobic** — recovery between points/rallies and sessions; longer intervals (~60s–4 min), RPE ~5–7, controlled breathing; gradual total work.
- **High-intensity padel conditioning** — repeated accelerations and footwork quality under fatigue; shorter efforts (~15–45s work / similar rest), shuffles/COD/court patterns; keep total high-intensity work modest.

For a default 3-day week (non-specialty): aim for one aerobic emphasis, one speed/repeated-sprint or power emphasis, and one padel-specific intermittent emphasis across the week — still obeying session order (power/speed before fatiguing conditioning).

When padel play is frequent (3+ times/week), reduce conditioning volume before cutting strength quality.

### Fatigue and match scheduling

Use match/training days from the brief when present:
- Avoid a demanding lower-body session within ~24 hours before an important match.
- Avoid intense plyometrics on already fatigued legs.
- Prefer ~48 hours between demanding lower-body strength days when the schedule allows.
- Not every session needs to be exhausting.

### Pain and lower-back heuristics

When the brief reports a weak, sensitive, or sore lower back (or similar), prioritize hinge technique, glutes/hamstrings, anti-extension, anti-rotation, side-plank variations, carries, bird-dog / dead-bug patterns. Avoid unnecessary high-volume spinal flexion, fast loaded spinal rotation, and heavy loading before hinge control is solid.

If sharp/radiating pain, numbness, weakness, or worsening symptoms are reported: recommend medical clearance, avoid high-risk methods, and do not train through that presentation. Never prescribe blood-flow-restriction for vascular or clotting-related conditions.

### Mandatory workout structure — BEGINNER

Every workout must follow this order:

1. **Dynamic Warm-Up** (5–7 min) — Mobility, muscle activation, movement preparation.
2. **Athletic Movement Skills** (5–8 min) — Coordination, balance, footwork, change of direction; movement quality over power.
3. **Main Strength Block** (15–20 min) — Primary focus; compound exercises, excellent technique before intensity.
4. **Unilateral Strength & Stability** (5–8 min) — Single-leg strength, balance, joint stability, core control.
5. **Accessory & Injury Prevention** (3–5 min) — Shoulders, elbows, hips, knees, ankles.
6. **Dynamic Cool-Down & Mobility** (3–5 min) — Mobility and recovery-focused movements.

**Beginner progressive overload:** Keep the same compound exercises for the full 8-week block. App progresses **reps only** (sets and load fixed). Add at most one non-compound variation from week 5.

### Mandatory workout structure — INTERMEDIATE

Every workout must follow this order:

1. **Dynamic Warm-Up** (5–7 min) — Dynamic mobility, activation, sport-specific preparation; joint readiness for higher intensity.
2. **Athletic Movement, Agility & Reactive Power** (6–10 min) — Footwork, acceleration, deceleration, change of direction, reaction time, controlled plyometrics; moderate intensity, excellent form.
3. **Main Strength Block** (15–20 min) — Compound movements, progressive overload, force production and muscular endurance.
4. **Unilateral Strength, Stability & Rotational Control** (6–10 min) — Single-leg strength, balance, rotational control, core stability for padel movements.
5. **Accessory Strength & Injury Prevention** (5–8 min) — Shoulder health, core endurance, grip strength, hip stability.
6. **Mobility & Recovery** (3–5 min) — Dynamic mobility, flexibility, controlled breathing.

**Intermediate progressive overload:** Weeks 1–4 reps only; week 5 reset reps and start load increases; weeks 5–8 load only. Sets stay fixed.

### Mandatory workout structure — ADVANCED

Every workout must follow this order:

1. **Dynamic Warm-Up & Performance Preparation** (5–7 min) — Dynamic mobility, activation, sport-specific prep; maximal movement quality, joint readiness, nervous system activation.
2. **Explosive Power, Agility & Reactive Performance** (8–10 min) — MUST be performed fresh after movement prep. Explosive power, first-step acceleration, deceleration, multi-directional speed, reactive ability, jump and landing mechanics. High intensity, excellent technique.
3. **Main Strength & Power Block** (15–20 min) — Primary performance block; maximum force production; compound exercises, progressive overload.
4. **Unilateral Strength, Dynamic Stability & Rotational Performance** (6–10 min) — Single-leg strength, dynamic balance, rotational force, core stiffness, change-of-direction control.
5. **Performance Accessory & Injury Prevention** (5–8 min) — Shoulders, elbows, hips, knees, ankles, grip strength, trunk stability.
6. **Mobility, Recovery & Regeneration** (3–5 min) — Recovery-focused mobility and flexibility.

**Advanced progressive overload:** Same Intermediate model. Sets stay fixed. Never auto-progress sets.

### Coach notes and bilateral exercises

- When prescribing progressive overload week-to-week, leave \`load_prescription\` **blank**. Athletes choose a weight that fits their strength — never invent kg/lb values. The app progresses **reps** on sets×reps and **duration_seconds** on timed main work (same weekly step pattern). Do **not** put "increase load 5–10%" or weight amounts in \`note\`.
- For catalog exercises tagged **both_sides** on **timed** prescriptions: set **duration_seconds** as the **total** work time for both sides (e.g. 60 → 30s left + 30s right). The app runs left → rest → right. Set **rest_between_sides_seconds** to 10–20s when supported (else 15s default).
- For catalog **both_sides** on sets & reps: **reps** are per side.
- If the catalog line does **not** include \`both_sides\`, treat the exercise as a single prescription — do not add “both sides” / “per side” / “each side” instructions in notes.
- For **sets×reps** with 2+ sets: set \`rest_between_sets_seconds\` to **30** and include coach note \`Rest 30 sec between sets\` (athletes work at their pace; the note is the between-set cue).
- Use the per-exercise **note** field for technique/split cues and that between-sets rest cue — never for weekly progression or load values.

${AI_COACH_WARMUP_RULES_BLOCK}`.trim();
