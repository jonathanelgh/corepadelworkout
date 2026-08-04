# Program progress — implementation guide

How Core Padel Workout tracks and shows progress for multi-day programs, and what happens when a member opens a program they already started.

Related:

- Member hub: [`docs/member-dashboard.md`](./member-dashboard.md)
- Workout player: [`docs/taking-workouts.md`](./taking-workouts.md)

Canonical logic: `src/lib/programs/program-progress.ts`  
Server actions: `src/app/programs/program-progress-actions.ts`

Progress sequencing applies to **`training_plan`** only. **`single_workout`** may log completions but does not create `program_runs` or “next day” flow.

---

## Overview

```
Access (free / Pro / enrollment)
  → Start program → program_runs (locks location track)
  → Play sessions → program_session_completions (started_at / completed_at)
  → Progress = completed sessions on that track / total sessions
  → Next session = first incomplete in sort order
```

**Important:** Enrollment (`program_enrollments`) = **access/ownership**.  
A **run** (`program_runs`) = **started training**.  
“My programs” ≠ “Your training”.

---

## 1. Data model

### Curriculum hierarchy

```
programs
  └── program_location_tracks   (gym / home / at-the-court)
        ├── program_weeks
        └── program_sessions    (“training days”)
              └── program_exercises
```

| Table | Key columns | Notes |
|-------|-------------|-------|
| `programs` | `id`, `slug`, `status`, `is_free`, `program_format` | `training_plan` \| `single_workout` |
| `program_location_tracks` | `id`, `program_id`, `location_id`, `sort_order` | One curriculum per location |
| `program_weeks` | `id`, `track_id`, `week_number`, `name`, `sort_order` | Groups sessions |
| `program_sessions` | `id`, `track_id`, `week_id`, `name`, `sort_order`, … | Playable “day” |

### Progress / entitlement

| Table | Key columns | Constraints |
|-------|-------------|-------------|
| **`program_runs`** | `user_id`, `program_id`, **`track_id`**, `started_at`, `updated_at` | **Unique `(user_id, program_id)`** — one follow-through per program. `track_id` freezes which location curriculum they train on. |
| **`program_session_completions`** | `user_id`, `program_id`, `session_id`, `started_at`, `completed_at` | **Unique `(user_id, session_id)`**. Start-only or complete-only rows allowed. |
| **`program_enrollments`** | `user_id`, `program_id`, `status`, price/Stripe | Access only — not progress |

**Access** (`user_has_program_access`): published + free, **or** active Pro, **or** active enrollment.

---

## 2. Starting a program run

### `ensureProgramRun(userId, programId, profile?, format)`

| Format | Behavior |
|--------|----------|
| `single_workout` | No insert; returns progress view only |
| `training_plan` | Resolve track from profile location prefs (else first track). If no run row → **insert** `{ user_id, program_id, track_id }`. Existing run is **not** moved to a new track. |

Throws if the program has no training days.

### `startProgramTraining(slug)` (Start / Continue / Repeat CTA)

1. Auth required
2. Published + access check
3. If free → enroll (idempotent)
4. `ensureProgramRun`
5. Navigate:
   - **`training_plan`** → `/programs/{slug}/training`
   - **`single_workout`** → `/programs/{slug}/play?session={id}`

### Implicit start

Opening `/programs/[slug]/play` for a `training_plan` also calls `ensureProgramRun` after access — so play can create a run without the Start button.

### Cancel / re-start

`cancelProgramTraining`: delete all completions for that user+program, then delete the run → back to catalog detail.

Confirm copy: progress is cleared; they can start again. Re-start = new `ensureProgramRun` (track re-resolved from **current** profile prefs).

---

## 3. Progress calculation (`loadProgramProgress`)

Returns `ProgramProgressView | null`:

| Field | Meaning |
|-------|---------|
| `runId` | `program_runs.id` or `null` |
| `trackId` | From run, else preferred track |
| `startedAt` | Run `started_at` |
| `sessions` / `weeks` | Curriculum with `startedAt` / `completedAt` per session |
| `completedCount` | Sessions with truthy `completedAt` |
| `totalSessions` | Session count on that track |
| `nextSession` | See below |
| `isComplete` | `training_plan` only: all sessions completed |

### Track selection

- **With run** → load sessions for `run.track_id` (stable)
- **Without run** → prefer profile `training_environments` / `training_environment` mapped to track location (`gym` → gym, `home` → home, `club` → at-the-court); else lowest `sort_order` track

### Next session

| Format | Rule |
|--------|------|
| `training_plan` | First session in sort order with `!completedAt` |
| `single_workout` | Always `sessions[0]` (not gated on completion) |

### Percentage (UI)

```ts
totalSessions > 0
  ? Math.round((completedCount / totalSessions) * 100)
  : 0
```

### Active week label

Week containing `nextSession`, else first incomplete week, else last week →  
`"completedInWeek/totalInWeek · weekName"` (e.g. `1/3 · Week 2`).

### Edge cases

| Case | Behavior |
|------|----------|
| No sessions, no run | `null` |
| No sessions, run exists | Empty progress, `runId` set, not complete |
| No run, sessions exist | Progress with `runId: null` (preview schedule / Start CTA) |
| All complete | `nextSession: null`, `isComplete: true` |
| Completions for other tracks | Ignored (only current track sessions count) |

### Href helpers

```ts
playHrefForSession(slug, sessionId) // /programs/{slug}/play?session={id}
programTrainingHref(slug)           // /programs/{slug}/training
programCatalogHref(slug)            // /programs/{slug}
programInfoHref(slug)               // /programs/{slug}?view=info
```

---

## 4. Visiting the program page with an active run

**File:** `src/app/programs/[slug]/page.tsx`

### Redirect rule (training plans)

If the user is signed in **and** format is `training_plan` **and** `progress.runId` exists **and** URL is **not** `?view=info`:

→ **`redirect(/programs/{slug}/training)`**

They never see the marketing detail page while the program is active — they land on the **training hub**.

### Force marketing detail

`/programs/{slug}?view=info` bypasses the redirect (linked as “Program info” from the hub).

### When they stay on the detail page

Guests, no run yet, `single_workout`, or `?view=info`.

Footer **`ProgramAccessBar`** CTAs:

| State | CTA |
|-------|-----|
| No access, paid | Unlock with Pro |
| Free, signed out | Sign in to start |
| Access, `single_workout` | Start workout |
| Access, no `runId` | **Start program** |
| Access, run, incomplete | **Continue · {nextSession.name}** |
| Access, run, complete | **Repeat program** |
| Access + `runId` | Cancel program link |

Start / Continue / Repeat all call `startProgramTraining` → for plans that goes to the **training hub**, not straight into play.

---

## 5. Training hub (`/programs/[slug]/training`)

Component: `ActiveProgramHub`

### Gates

- Login required
- Free **or** `userHasProgramAccess` (else `?upgrade=1`)
- Must have `runId` (else back to catalog)

### UI

| Block | Content |
|-------|---------|
| Header | Cover, difficulty, title; subtitle = “Program complete” or week label |
| Stats | Days done `completed/total`, % complete, minutes per session |
| Progress bar | `%` from completed/total |
| **Next up** | Card → `playHrefForSession` for `nextSession` (if not complete) |
| **Complete** | Trophy + **Train again** → first session play URL (**does not** clear completions) |
| Tabs | Schedule / Training log |
| Cancel | Clears run + all completions |

### Schedule rows

- Grouped by weeks (`week.name`)
- Done = check + completed date; incomplete = circle; next highlighted
- Incomplete only: Play → session URL; label **Continue** if next else **Start**
- Completed rows: **no** play button (replay via Train again or direct URL)

### Training log

Sessions with `startedAt` or `completedAt`, newest first. “In progress” if started and not completed. Shows program `startedAt` banner.

---

## 6. Where else progress appears

| Surface | What |
|---------|------|
| **`/member` → Your training** | Active `program_runs` (skip unpublished / `single_workout`); progress bar; CTA → **training hub** |
| Program detail schedule panel | Shown when `totalSessions > 0` (even with no run / 0%) |
| Access bar week label | `formatActiveWeekProgressLabel` |
| Workout finish overlay | `programComplete` if this finish completes the plan; next session CTA |
| Member AI coach context | Active programs + recent completions |
| Admin user detail | Same progress numbers |

**Not progress:** “My programs” enrollments = ownership only. Quick workouts = play links, no run bars.

---

## 7. Logging from the workout player

| Event | Action | DB |
|-------|--------|-----|
| Tap **Start** (lobby → prep) | `logProgramSessionStart` | Insert or update `started_at = now()` (even if already completed) |
| Last exercise finished | `logProgramSessionComplete` | Upsert `completed_at = now()`; for plans bump `program_runs.updated_at` |

Notes:

- Complete does **not** require a prior start
- “Next session” is **derived**, not stored
- Play page may set optimistic `programComplete` when finishing the last incomplete day

---

## 8. `training_plan` vs `single_workout`

| | **`training_plan`** | **`single_workout`** |
|--|---------------------|----------------------|
| `program_runs` | Yes | Never |
| Completions drive next / % | Yes | Optional log only |
| `isComplete` | When all days done | Always false |
| Start destination | `/training` | `/play?session=…` |
| Detail → hub redirect | Yes if `runId` | No |
| `/training` | Hub UI | Redirect to play |
| Member “Your training” | Included | Skipped |
| Cancel program | Yes | N/A |

---

## 9. Location tracks

- Curriculum is **per track** (location).
- Track is chosen at **first** `ensureProgramRun` from profile prefs and stored on `program_runs.track_id`.
- Changing profile location later **does not** switch an existing run.
- After cancel + re-start, track is resolved again from current prefs.
- Completions are per `session_id` (track-specific).

---

## 10. User flows (happy paths)

### First start

```
/programs/{slug}
  → Start program
  → ensureProgramRun + enroll if free
  → /programs/{slug}/training
  → Next up → /play?session=…
  → Complete session → completion row
  → Hub shows 1/N, next day highlighted
```

### Return visit (active run)

```
/programs/{slug}
  → redirect → /programs/{slug}/training
  → Continue next incomplete day
```

### See marketing while active

```
/programs/{slug}?view=info
  → marketing detail + Continue CTA → still goes to hub via startProgramTraining
```

### Finish whole program

```
Complete last day
  → isComplete
  → Hub: “Program complete”, Train again (replay day 1, progress kept)
  → Cancel to wipe and start fresh
```

---

## 11. Key files

| Path | Role |
|------|------|
| `src/lib/programs/program-progress.ts` | Load / ensure / cancel / start / complete; active programs |
| `src/app/programs/program-progress-actions.ts` | Server actions |
| `src/lib/programs/program-sessions.ts` | Track / session / week fetch |
| `src/lib/programs/program-format.ts` | Format + `usesProgramProgress` |
| `src/lib/programs/program-routes.ts` | Training / info / catalog hrefs |
| `src/lib/programs/check-program-access.ts` | Access RPC |
| `src/app/programs/[slug]/page.tsx` | Detail + **redirect if active run** |
| `src/app/programs/[slug]/training/page.tsx` | Training hub gate |
| `src/app/programs/[slug]/play/page.tsx` | Player + ensure run |
| `src/components/programs/active-program-hub.tsx` | Hub UI |
| `src/components/programs/program-schedule-panel.tsx` | Week / session badges |
| `src/components/programs/program-training-log-panel.tsx` | Log |
| `src/app/programs/program-access-bar.tsx` | Detail CTAs |
| `src/components/member/member-home-tab.tsx` | “Your training” cards |

---

## 12. URL quick reference

| URL | Behavior |
|-----|----------|
| `/programs/[slug]` | Marketing detail; **→ `/training`** if signed-in plan with active run |
| `/programs/[slug]?view=info` | Force marketing detail |
| `/programs/[slug]?upgrade=1` | Detail after denied access |
| `/programs/[slug]/training` | Active hub (requires run) |
| `/programs/[slug]/play?session={uuid}` | Player; may create run |
| `/programs/[slug]/play` | Redirect to next incomplete (plan) or first session |
| `/member` | “Your training” from active runs |

---

## 13. Native checklist

1. Separate **enrollment** (access) from **run** (started training).
2. One `program_runs` row per user+program; store `track_id` at create.
3. Completions unique per user+session; track `started_at` and `completed_at`.
4. `completedCount` / `totalSessions` / `%` / next = first without `completedAt`.
5. Opening program detail with an active run → open **training hub**, not marketing (unless info mode).
6. Start CTA for plans → hub; Continue next day → play URL.
7. Player: log start on begin; log complete on finish; bump run `updated_at`.
8. Home “active programs” from **runs**, not enrollments.
9. Cancel deletes run + completions; “Train again” does **not**.
10. `single_workout`: no hub progress / no run / play first session.
