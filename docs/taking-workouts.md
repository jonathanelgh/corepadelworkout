# Taking workouts — native implementation guide

This documents how Core Padel Workout runs a session today. Canonical implementation:

- Player UI: `src/components/programs/active-workout-player.tsx`
- Playlist expand: `src/lib/programs/expand-workout-playlist.ts`
- Prescription helpers: `src/lib/programs/program-exercises.ts`
- Choice groups / phases: `src/lib/programs/session-phase.ts`
- Progress: `src/lib/programs/program-progress.ts` + `src/app/programs/program-progress-actions.ts`

Web entry: `/programs/[slug]/play?session=<sessionUuid>`

---

## 1. High-level flow

```
Load session exercises (ordered)
  → User picks choice_group alternatives (if any)
  → Resolve playlist (one exercise per choice group)
  → Expand bilateral timed exercises into left/right steps
  → Lobby → Start → 5s prep → work/rest loop
  → Finish → log completion → overlay / next session
```

Two indexes matter:

| Index | Meaning |
|--------|---------|
| `currentIndex` | Index into **expanded** playback steps |
| `currentSet` | Round within a non-bilateral timed multi-set exercise |

Bilateral timed work is expanded into multiple steps, so each side/round is its own `currentIndex`. Non-bilateral timed multi-sets stay **one** step and use `currentSet`.

---

## 2. Data model to fetch

### Tables

**`program_exercises`** (session prescription)

| Column | Role |
|--------|------|
| `id` | Row id (playback identity before expand) |
| `session_id` | Session |
| `sort_order` | Order |
| `exercise_id` | Catalog exercise |
| `duration_seconds` | Preferred timed work |
| `duration_minutes` | Legacy timed work |
| `sets` | Sets / rounds |
| `reps` | Reps (sets×reps; for both_sides = **per side**) |
| `rest_between_sets_seconds` | Rest between sets/rounds |
| `rest_between_sides_seconds` | Rest left → right (timed both_sides) |
| `rest_after_seconds` | Rest after exercise → next |
| `load_prescription` | e.g. `"12 kg"` |
| `session_phase` | `warmup` \| `main` \| `cooldown` |
| `choice_group` | Same string = pick one of N |
| `note` | Coach note shown in player |

**`exercises`**

| Column | Role |
|--------|------|
| `title`, `image_url`, `video_url` | Media / labels |
| `both_sides` | Bilateral flag |

**`programs`**: `song_url`, `cover_image_url`, `program_format` (`training_plan` \| `single_workout`), etc.

### App type (mirror this)

```ts
type ProgramExerciseItem = {
  id: string;                 // program_exercises.id
  exerciseId: string;
  title: string;
  image_url: string | null;
  video_url: string | null;
  bothSides: boolean;
  sessionPhase: "warmup" | "main" | "cooldown";
  choiceGroup: string | null;
  durationMinutes: number | null;
  durationSeconds: number | null;
  sets: number | null;
  reps: number | null;
  restBetweenSetsSeconds: number | null;
  restBetweenSidesSeconds: number | null;
  restAfterSeconds: number | null;
  loadPrescription: string | null;
  note: string | null;
};
```

There is **no** `prescription_type` column — infer it.

---

## 3. Prescription types

```ts
type PrescriptionType = "sets_reps" | "time" | "timed_intervals";

function infer(ex): PrescriptionType {
  const hasDuration =
    (ex.durationSeconds > 0) || (ex.durationMinutes > 0);
  const sets = ex.sets > 0 ? round(ex.sets) : 0;
  const hasBetween =
    ex.restBetweenSetsSeconds != null && ex.restBetweenSetsSeconds > 0;

  if (hasDuration && (sets > 1 || hasBetween)) return "timed_intervals";
  if (hasDuration) return "time";
  return "sets_reps";
}
```

| Type | Player behavior |
|------|------------------|
| `time` | One timed work bout, then optional `rest_after` |
| `timed_intervals` | Timed work × `sets` rounds, optional rest between rounds, then `rest_after` |
| `sets_reps` | **No work timer** — athlete taps Next when done |

Helpers:

- `workDurationSeconds`: `durationSeconds` else `durationMinutes * 60` else **60**
- `setsCount`: `sets` if > 0 else **1**
- `restBetweenSetsSeconds`: 0 if unset; cap 3600
- `restAfterSeconds`: 0 if unset; cap 3600
- `restBetweenSidesSeconds`: explicit or default **15**
- Timed playback: `time` or `timed_intervals`

---

## 4. Choice groups

Before expand:

1. Group exercises with the same non-null `choiceGroup`
2. Lobby: athlete picks one option per group (default = first)
3. `resolveWorkoutPlaylist`: keep non-grouped exercises; for each group keep only the selected one (order preserved)

```ts
// Pseudocode
for (ex of exercises) {
  if (!ex.choiceGroup) { out.push(ex); continue; }
  if (alreadyPicked(ex.choiceGroup)) continue;
  out.push(selectedOrFirst(ex.choiceGroup));
}
```

---

## 5. Playlist expansion (both_sides timed)

Only expand when `bothSides && isTimed`.

**Critical rule:** `duration_seconds` is **TOTAL** for both sides. Split for playback only (overwrite step `durationSeconds` to per-side). Labels must not split again when `workoutSide` is set:

```ts
// Unexpanded / overview: "60s total · 30s/side · 15s switch"
// Expanded step: "30s" (and Left/Right badge) — never "30s total · 15s/side"
```

Split:

```ts
total = max(2, round(duration))
left  = max(1, floor(total / 2))
right = max(1, total - left)   // sums to total
```

For each round `1…setsCount`, emit **left then right**. Attach post-work rest:

| After | Rest kind | Seconds |
|-------|-----------|---------|
| Left | `side_switch` | `rest_between_sides` (default 15) |
| Right, more rounds, between-sets > 0 | `between_sets` | `rest_between_sets` |
| Right, last round, not last exercise | `between_exercises` | `rest_after` |
| Else | none | 0 |

Expanded step shape:

```ts
type WorkoutPlaybackStep = ProgramExerciseItem & {
  playbackKey: string;           // e.g. `${id}-r${round}-left`
  workoutSide: "left" | "right" | null;
  playbackSet: number;           // round number
  playbackSetsTotal: number;
  postWorkRestSeconds: number;
  postWorkRestKind: "side_switch" | "between_sets" | "between_exercises" | null;
  durationSeconds: number;       // overwritten to per-side seconds
};
```

Non-expanded: one step, `workoutSide: null`, `postWorkRest* = 0/null`. Multi-set timed **without** both_sides is **not** expanded — handled with `currentSet` in the player.

**both_sides + sets_reps:** do **not** expand. Show “both sides” chip; hide coach note; athlete does both sides at their pace.

---

## 6. State machine

### Constants

- Prep before first work: **5 seconds** (`FIRST_EXERCISE_PREP_SECONDS`)
- Music work volume: **1.0**
- Music rest volume: **0.07**
- Default side rest: **15s**

### Phases

```
lobby (choices + Start)
  → prep (5s countdown; music off; isRunning = false)
  → work
  → setRest   // side switch OR between sets/rounds
  → rest      // between exercises (rest_after)
  → … → finished
```

`phase`: `"work" | "setRest" | "rest"`  
Plus flags: `workoutStarted`, `prepCountdown`, `workoutFinished`, `isRunning`, `secondsLeft`.

### Start

1. Log `program_session_completions.started_at`
2. Prep 5s (show first exercise video + title)
3. At 0 → `isRunning = true`, begin work on step 0

### Begin work for step `i`

- If timed: start beeps, `secondsLeft = workDurationSeconds(step)`
- If sets_reps: `secondsLeft = null`
- Bilateral: `currentSet = step.playbackSet`
- Else: `currentSet = 1`

### Finish work (`finishWorkPhase`)

```
if bilateral step:
  if postWorkRestSeconds > 0:
    phase = (kind == between_exercises) ? rest : setRest
    secondsLeft = postWorkRestSeconds
  else advance

else if timed_intervals and currentSet < setsCount:
  if rest_between_sets > 0 → setRest
  else currentSet++, restart work timer + start beeps

else if rest_after > 0 and not last step → rest
else advance
```

### Rest expiry

- `setRest` + bilateral → `advance` (next side/round step)
- `setRest` + non-bilateral → `currentSet++`, start next set work
- `rest` → `advance`

### Advance

- If last step → `workoutFinished`, log complete
- Else `currentIndex++`, begin work

### Controls

| Action | Behavior |
|--------|----------|
| Pause/Play | Toggles `isRunning` (timer + music + video) |
| Next (timed work) | Skip remaining work → `finishWorkPhase` |
| Next (setRest/rest) | Skip rest / advance |
| Next (sets_reps) | Advance exercise |
| Next on last sets_reps | Finish |
| Prev | Jump to previous **playback step**, begin work (no re-prep) |
| Disabled | Prev at 0; no Prev/Next during prep |

### Timer tick

Only when: started, timed, not prep, `isRunning`, `secondsLeft > 0`. 1 Hz countdown. At `0`: end beep → `finishWorkPhase` or rest advance.

---

## 7. UI rules worth mirroring

| Situation | Show |
|-----------|------|
| Phase change | Banner: Warm-up / Main workout / Cool-down |
| Bilateral side | “Left side” / “Right side” |
| Side switch rest | “Switch sides” + next side preview |
| Between rounds (bilateral) | “Rest between rounds” |
| Between sets (non-bilateral) | “Rest between sets” |
| Exercise rest | “Get ready for” + next exercise |
| sets_reps | Prescription label or “Go at your pace”; “Tap Next when you finish…” |
| Coach note | Show unless `bothSides` |
| both_sides untimed | Both-sides chip; **no note**; show sets/reps with “per side” |
| Timed work under note | Do not show the long prescription meta line during work (web removed this) |

During side-switch / between-exercise rest, video previews the **next** step.

---

## 8. Audio

### Program music (`programs.song_url`)

- Off until after prep
- Work: volume 1.0; rest/setRest: 0.07
- Paused or muted → pause track
- Mute toggle independent of beeps

### Cue schedule

| Event | Cue |
|-------|-----|
| Work starts | Start beeps |
| Work ends (timer 0) | End beeps |
| Work at 3s **and** rest will follow | Work-ending cue (voice + beep) |
| Prep/rest/setRest at 3s | Rest-ending cue (beep + start voice) |

Exercise video is always muted/looping; don’t rely on video audio.

---

## 9. Progress logging

Table: **`program_session_completions`**  
Unique: `(user_id, session_id)`  
Fields: `started_at`, `completed_at`, `program_id`, `session_id`, `user_id`

| When | Action |
|------|--------|
| Tap Start | Upsert / set `started_at = now()` |
| Workout finished | Upsert `completed_at = now()` |

Notes:

- Complete does **not** require a prior start
- Re-starting updates `started_at` even if previously completed
- `training_plan`: also touch `program_runs`; drive “next session” from incompletes
- `single_workout`: completion optional for hub UX

---

## 10. Example timelines

### Timed both_sides, 60s total, 2 rounds, 15s side, 30s between rounds, 45s after

```
L 30s → side 15s → R 30s → between 30s →
L 30s → side 15s → R 30s → after 45s → next exercise
```

### Timed intervals (not both_sides), 40s × 3, 20s between, 45s after

```
work 40 → setRest 20 → work 40 → setRest 20 → work 40 → rest 45 → next
```

(Single playback step; `currentSet` 1→2→3)

### Sets×reps, 3×10, rest_between_sets=30, note “Rest 30 sec between sets”

```
Show note + “3 sets · 10 reps · 30s between sets”
No auto timer between sets — athlete manages rest, taps Next when done
```

---

## 11. Native checklist

1. Fetch session exercises ⨝ exercises, order by `sort_order`
2. Choice groups → resolve playlist
3. Port `inferExercisePrescriptionType` + rest/duration helpers exactly
4. Port `expandWorkoutPlaybackPlaylist` (total duration split)
5. State machine: lobby → prep(5) → work / setRest / rest
6. Dual index: expanded `currentIndex` + `currentSet` for non-bilateral intervals
7. Next/Prev/Pause semantics above
8. Hide notes on `bothSides`; don’t auto-rest sets_reps
9. Log start + complete to `program_session_completions`
10. Optional: music ducking + 3s cues
11. Treat `duration_seconds` on both_sides as **total**, not per side

---

## 12. Files to port almost 1:1

1. `src/lib/programs/program-exercises.ts` — inference + helpers
2. `src/lib/programs/expand-workout-playlist.ts` — expand
3. `src/lib/programs/session-phase.ts` — choice resolve
4. `src/components/programs/active-workout-player.tsx` — state machine (logic only)
