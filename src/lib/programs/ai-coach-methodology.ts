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

### Mandatory workout structure — BEGINNER

Every workout must follow this order:

1. **Dynamic Warm-Up** (5–7 min) — Mobility, muscle activation, movement preparation.
2. **Athletic Movement Skills** (5–8 min) — Coordination, balance, footwork, change of direction; movement quality over power.
3. **Main Strength Block** (15–20 min) — Primary focus; compound exercises, excellent technique before intensity.
4. **Unilateral Strength & Stability** (5–8 min) — Single-leg strength, balance, joint stability, core control.
5. **Accessory & Injury Prevention** (3–5 min) — Shoulders, elbows, hips, knees, ankles.
6. **Dynamic Cool-Down & Mobility** (3–5 min) — Mobility and recovery-focused movements.

**Beginner progressive overload:** Keep the same core exercises for the full 4-week block. Each week increase only ONE variable: weight OR reps OR sets (never multiple in the same week). Add exactly one new exercise per workout per week for variety without sacrificing movement quality.

### Mandatory workout structure — INTERMEDIATE

Every workout must follow this order:

1. **Dynamic Warm-Up** (5–7 min) — Dynamic mobility, activation, sport-specific preparation; joint readiness for higher intensity.
2. **Athletic Movement, Agility & Reactive Power** (6–10 min) — Footwork, acceleration, deceleration, change of direction, reaction time, controlled plyometrics; moderate intensity, excellent form.
3. **Main Strength Block** (15–20 min) — Compound movements, progressive overload, force production and muscular endurance.
4. **Unilateral Strength, Stability & Rotational Control** (6–10 min) — Single-leg strength, balance, rotational control, core stability for padel movements.
5. **Accessory Strength & Injury Prevention** (5–8 min) — Shoulder health, core endurance, grip strength, hip stability.
6. **Mobility & Recovery** (3–5 min) — Dynamic mobility, flexibility, controlled breathing.

**Intermediate progressive overload:** Same core exercises for 4 weeks. Each week increase only ONE variable: weight OR reps OR sets OR tempo (when appropriate). Never multiple in the same week. Add exactly one new exercise per workout per week.

### Mandatory workout structure — ADVANCED

Every workout must follow this order:

1. **Dynamic Warm-Up & Performance Preparation** (5–7 min) — Dynamic mobility, activation, sport-specific prep; maximal movement quality, joint readiness, nervous system activation.
2. **Explosive Power, Agility & Reactive Performance** (8–10 min) — MUST be performed fresh. Explosive power, first-step acceleration, deceleration, multi-directional speed, reactive ability, jump and landing mechanics, court movement efficiency. High intensity, excellent technique.
3. **Main Strength & Power Block** (15–20 min) — Primary performance block; maximum force production; compound exercises, progressive overload.
4. **Unilateral Strength, Dynamic Stability & Rotational Performance** (6–10 min) — Single-leg strength, dynamic balance, rotational force, core stiffness, change-of-direction control, deceleration under speed.
5. **Performance Accessory & Injury Prevention** (5–8 min) — Shoulders, elbows, hips, knees, ankles, grip strength, trunk stability; durability and season-long joint health.
6. **Mobility, Recovery & Regeneration** (3–5 min) — Recovery-focused mobility and flexibility.

**Advanced progressive overload:** Same core exercises for 4 weeks. Each week increase only ONE variable: weight OR reps OR sets OR movement complexity OR training intensity. Never multiple in the same week. Add exactly one new exercise per workout per week.

### Coach notes and bilateral exercises

- When prescribing progressive overload week-to-week, include a coach **note** on relevant strength exercises telling the athlete to increase load by **5–10%** when they can complete all prescribed sets and reps with good form.
- For catalog exercises tagged **both_sides**: add a coach **note** that the exercise is performed on both sides, and **adapt** duration, sets, reps, or timed sets so total work accounts for both sides (e.g. timed hold per side, or sets × 2 when appropriate).
- Use the per-exercise **note** field on generate_workout and generate_program exercises for these coach cues.

${AI_COACH_WARMUP_RULES_BLOCK}`.trim();
