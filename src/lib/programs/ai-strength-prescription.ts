/**
 * Strength-tag prescription + central rest matrix for the AI Coach system prompt.
 * Catalog lines expose tags as `types:strength_endurance/...` — match those slugs.
 * Product field names: rest_between_sets_seconds, rest_after_seconds (not rest_after_exercise_seconds).
 */

export const AI_COACH_STRENGTH_PRESCRIPTION_BLOCK = `## Strength prescription rules (catalog strength tags)

Use the exercise catalog \`types:\` tags (e.g. \`strength_endurance\`, \`strength_hypertrophy\`) to set sets, reps/duration, and rest.

### Multiple strength tags on one exercise
- Use ONLY the prescription that matches the session's **declared primary objective** (day role / brief).
- Ignore other strength-tag prescriptions on that exercise — never average or combine.

### Leave load blank
- Never invent kg/lb. Athletes choose a weight that fits their strength.
- Execution cues may say "heavy" / "moderate intent" without naming a load.

### strength_endurance
Levels: Beginner, Intermediate, Advanced  
Sets: 2–4 · Reps: 12–20 · Controlled tempo; stop before technique deteriorates  
\`rest_between_sets_seconds\`: 30–60 · \`rest_after_seconds\`: 30–60

### strength_hypertrophy
Levels: Intermediate, Advanced (Beginner only when appropriate)  
Sets: 3–4 · Reps: 8–12 · Controlled eccentric; full ROM  
\`rest_between_sets_seconds\`: 60–90 · \`rest_after_seconds\`: 60–90

### strength_maximalstrength
Levels: Intermediate, Advanced  
Sets: 3–5 · Reps: 3–6 · Heavy intent; perfect technique  
\`rest_between_sets_seconds\`: 120–180 · \`rest_after_seconds\`: 120–180

### strength_supramaximalstrength
Levels: **Advanced only** · Admin/specialist use only — never auto-select for members  
Sets: 3–5 · Reps: 1–3  
\`rest_between_sets_seconds\`: 180–300 · \`rest_after_seconds\`: 180–300

### strength_speedstrength
Levels: Intermediate, Advanced  
Sets: 3–5 · Reps: 3–6 · Moderate load intent; maximal safe speed  
\`rest_between_sets_seconds\`: 90–180 · \`rest_after_seconds\`: 90–180

### strength_explosive
Levels: Intermediate, Advanced  
Sets: 3–5 · Reps: 3–6 · Stop when speed or landing quality drops  
\`rest_between_sets_seconds\`: 120–180 · \`rest_after_seconds\`: 120–180

### strength_plyometric
Levels: Intermediate, Advanced  
Sets: 3–5 · Reps/contacts: 3–6 · Low fatigue; excellent landing/reactive quality  
\`rest_between_sets_seconds\`: 90–180 · \`rest_after_seconds\`: 90–180  
Main timed plyometrics: either one continuous \`duration_seconds\` bout **or** 2–3 rounds with \`rest_between_sets_seconds\` when you want intervals.

### strength_specific
Levels: All (scaled)  
Sets: 2–4 · Reps: 6–12 (per side only if catalog \`both_sides\`) · Clear padel transfer  
\`rest_between_sets_seconds\`: 60–120 · \`rest_after_seconds\`: 60–120

### strength_stability
Levels: All  
Sets: 2–4 · Reps: 8–12 **OR** a single hold 20–45s (\`duration_seconds\` only) **or** 2–3 timed rounds with rest between when you want intervals  
Controlled; no loss of alignment  
\`rest_between_sets_seconds\`: 30–60 · \`rest_after_seconds\`: 30–60

---

## Central rest rules

### Field definitions
- \`rest_between_sets_seconds\` — recovery between sets/rounds of the **same** exercise.
- \`rest_after_seconds\` — recovery after the final set, before the **next** exercise.
- Never substitute one field for the other. Populate both when the exercise has 2+ sets/rounds.

### Rest matrix (by phase / tag)

**Warm-up — mobility / activation**  
between: 0 or 10–15 · after: 10–15  
(Warm-up templates are usually single timed blocks with no between-sets.)

**Warm-up — footwork / coordination**  
between: 15–20 · after: 15–20

**Warm-up — speed / explosive prep**  
between: 30–45 · after: 30–45

**Strength endurance / stability**  
between: 30–60 · after: 30–60

**Hypertrophy / general strength**  
between: 60–90 · after: 60–90

**Specific strength**  
between: 60–120 · after: 60–120

**Maximum strength / explosive**  
between: 120–180 · after: 120–180

**Speed-strength / plyometric**  
between: 90–180 · after: 90–180

**Supramaximal strength**  
between: 180–300 · after: 180–300

**Cool-down / recovery**  
between: 0 · after: 10–15

### AI decision order
1. Identify the session's primary objective.
2. Match the exercise strength tag (from catalog \`types:\`) to that objective.
3. Apply sets, reps or duration, and \`rest_between_sets_seconds\` from that tag.
4. Apply \`rest_after_seconds\` from the rest matrix (same band).
5. Never invent rest values outside these bands.
6. If multiple tags exist, pick one by session objective — do not blend.
7. For sets×reps with 2+ sets (and not both_sides), include coach note \`Rest {N} sec between sets\` using the chosen between-sets value.`.trim();
