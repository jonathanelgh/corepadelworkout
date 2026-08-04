# Member dashboard (`/member`) — implementation guide

This documents the logged-in member hub at `/member`: tabs, auth gates, data loading, Pro paywalls, AI coach, and outbound links into programs/workouts.

Related: workout playback is covered in [`docs/taking-workouts.md`](./taking-workouts.md).

---

## Overview

`/member` is a **single hub page** with client-side tab panels driven by `?tab=`. Legacy subpaths redirect into that hub. Separate shell pages exist for upgrade and the exercise library.

**Canonical entry:** `src/app/member/(shell)/page.tsx` → `loadMemberHubData` → `MemberHubLoader` → `MemberAppShell`.

---

## 1. Route entry

### App Router tree

| Path | File | Behavior |
|------|------|----------|
| `/member` | `src/app/member/(shell)/page.tsx` | Main hub (`force-dynamic`) |
| `/member` layout | `src/app/member/layout.tsx` | Auth + onboarding gate for all `/member/*` |
| `/member/(shell)/layout` | `src/app/member/(shell)/layout.tsx` | Pass-through |
| `/member/programs` | `src/app/member/(shell)/programs/page.tsx` | `redirect("/member?tab=workouts")` |
| `/member/custom` | `src/app/member/(shell)/custom/page.tsx` | `redirect("/member?tab=custom")` |
| `/member/profile` | `src/app/member/(shell)/profile/page.tsx` | `redirect("/member?tab=profile")` |
| `/member/upgrade` | `src/app/member/(shell)/upgrade/page.tsx` | Pro paywall / plans |
| `/member/exercises` | `src/app/member/(shell)/exercises/page.tsx` | Exercise library (Pro-gated) |
| `/member/onboarding` | `src/app/member/onboarding/page.tsx` | Legacy → `redirect("/onboarding")` |

### Search params (hub)

```ts
type PageSearch = Promise<{ tab?: string; billing?: string }>;
```

| Param | Values | Effect |
|-------|--------|--------|
| `tab` | omitted / unknown → **`home`**; `workouts`; `custom`; `profile` | Sets `initialTab` via `tabFromSearchParam` |
| `billing` | `success` | Shows post-checkout banner on Profile tab |

Helpers: `src/lib/member/member-tabs.ts`

```ts
export type MemberTab = "home" | "workouts" | "custom" | "profile";
// tabToHref("home") → "/member"
// tabToHref("workouts") → "/member?tab=workouts"
```

### Tab URL sync caveat

On the hub (when `hubData` is present), tab clicks only update React state — they do **not** push the query string. Deep links via `?tab=` work for the **initial** load only. Non-hub shell pages (`/member/upgrade`, `/member/exercises`) use `router.push(tabToHref(next))` because they have no `hubData`.

### Stripe return URLs

| Event | URL |
|-------|-----|
| Checkout success | `/member?tab=profile&billing=success` |
| Checkout cancel | `/member/upgrade?canceled=1` |
| Customer portal return | `/member?tab=profile` |

---

## 2. Auth / membership gates

### Layer A — `/member` layout

File: `src/app/member/layout.tsx`

1. No Supabase user → `/login?next=/member`
2. `profiles.onboarding_completed_at` null/missing → `/onboarding`

Same checks live in `getMemberShellContext()` (`src/lib/member/member-shell-context.ts`).

### Layer B — post-auth redirect

`resolvePostAuthRedirect` (`src/lib/member/resolve-post-auth-redirect.ts`): incomplete onboarding → `/onboarding`; else safe `next` or **`/member`**.

Middleware: logged-in users on login/signup are sent to `/member` (or `/onboarding`); failed admin routes bounce to `/member`.

### Layer C — Pro access

**Definition of Pro** (`getHasActivePro` / `loadMemberSubscriptionStatus`):

- Admin users → treated as Pro (`planName: "Admin"`)
- Else `customer_subscriptions` ⨝ `subscription_plans` where:
  - `subscription_plans.grants_all_programs = true`
  - `status` ∈ `active` \| `trialing`
  - `current_period_end` > now

**What Pro unlocks**

| Surface | Free | Pro |
|---------|------|-----|
| Dashboard / programs browse | Yes | Yes |
| Free programs (`programs.is_free`) | Via catalog / access RPC | Same |
| Paid programs | Purchase / enrollment | Full library |
| AI Coach (`?tab=custom`) | Paywall UI | Chat |
| `/member/exercises` | Paywall UI | Full list |
| Home “Unlock every program” banner | Shown | Hidden; emerald “Pro is active” strip instead |

Program session access elsewhere uses RPC `user_has_program_access` — Pro **or** active enrollment.

**Free vs Pro is not a hard redirect off `/member`.** Free members stay on the hub; Pro features show upgrade CTAs.

---

## 3. Tab structure

Shell: `MemberAppShell` (`src/components/member/member-app-shell.tsx`)

| Tab id | Desktop label | Mobile label | Panel component |
|--------|---------------|--------------|-----------------|
| `home` | Dashboard | Home | `MemberHomeTab` |
| `workouts` | Programs | Workouts | `MemberProgramsLibraryClient` |
| `custom` | Custom | Coach | `MemberCustomTab` → `MemberCoachClient` |
| `profile` | Profile | Profile | `MemberProfileTab` |

Also in desktop header: **Blog** → `/blog`. Avatar menu: Blog (mobile), Sign out.

**Coach mobile UX:** When `tab === "custom"` and Pro, bottom nav hides; header becomes “AI Coach” with Back → home.

### Home (`MemberHomeTab`)

1. Optional Pro promo (amber) → `/member/upgrade`
2. Or Pro active strip (plan name, renew date, cancel-at-period-end)
3. **Your training** — active `program_runs` with progress bar + Continue / View log
4. **Quick workouts** — `program_format = single_workout` → play links
5. **Latest programs** — 6 published `training_plan`s → `/programs/[slug]`; “Browse all” switches to `workouts` tab
6. **From the blog** — 3 posts → `/blog/[slug]`

### Workouts (`MemberProgramsLibraryClient`)

Client sub-tabs (local state, **not** URL): `all` \| `my`

- **All programs** — catalog → `/programs/[slug]`
- **My programs** — active `program_enrollments` only
  - Pro + empty: explain Pro unlocks all → switch to All
  - Free + empty: “No purchases yet”
  - Free + some: footer link to `/member/upgrade`

### Custom / Coach (`MemberCustomTab`)

- No Pro: amber “Pro required” + Subscribe + link to `?tab=profile`
- Pro: `MemberCoachClient` chat

### Profile (`MemberProfileTab`)

1. `SubscriptionSettings` (subscribe / manage / exercise library / view plans)
2. Training profile read-only rows + `ProfileEditSheet`

---

## 4. Data loading

### Hub loader — `loadMemberHubData`

File: `src/lib/member/load-member-hub-data.ts`

Parallel queries:

| Source | Table / fn | Filters / columns (high level) | Hub field |
|--------|------------|--------------------------------|-----------|
| Pro flag | `customer_subscriptions` + `subscription_plans` | via `getHasActivePro` | `hasActivePro` |
| Subscription UI | same | status, period end, cancel, plan name, stripe customer | `subscription` |
| Home programs | `programs` | `status=published`, `program_format=training_plan`, limit 6; joins categories, difficulty | `homePrograms` |
| Blog | `blog_posts` | `status=published`, `published_at <= now`, limit 3 | `blogPosts` |
| All programs | `programs` | all published; price, categories, difficulty | `allPrograms` |
| Categories | `categories` | `name`, `sort_order` | `categoryOptionsAll` |
| My programs | `program_enrollments` | `user_id`, `status=active` → nested `programs` | `myPrograms` |
| Profile | `profiles` + `padel_levels` | name, email, birth, gender, goals, envs, pains, level | `profileDetails` |
| Active training | `loadUserActivePrograms` | `program_runs` + completions | `activePrograms` |
| Quick workouts | `loadQuickWorkouts` | `programs` where `single_workout` | `quickWorkouts` |

### Profile columns used

`profiles`: `full_name`, `email`, `birth_date`, `gender`, `profile_image_url`, `primary_goal`, `training_environment`, `training_environments`, `padel_pains`, `padel_level_id` (via `padel_levels.name/slug`), `onboarding_completed_at` (gates only).

### Server actions

| File | Actions |
|------|---------|
| `src/app/member/profile-actions.ts` | `updateMemberProfile` → updates `profiles` (+ resolves `padel_levels` by slug); revalidates `/member` |
| `src/app/member/member-coach-actions.ts` | `loadMemberCoachData`, `sendMemberCoachMessage`, `saveMemberCoachWorkout` — all Pro-gated |

### Types

- `MemberHubData`, `MemberHubProfile`, … — `load-member-hub-data.ts`
- `MemberSubscriptionStatus` — `load-subscription-status.ts`
- `ActiveProgramSummary`, `QuickWorkoutSummary` — `program-progress.ts`
- `MemberTab` — `member-tabs.ts`

---

## 5. Active programs / enrollments / progress

### Active programs (“Your training”)

Loaded from **`program_runs`** (not enrollments alone), ordered by `updated_at` desc.

Per run:

- Join `programs` (`slug`, `title`, `cover_image_url`, `status`, `program_format`)
- Skip unpublished and `single_workout`
- `loadProgramProgress` → `program_session_completions` + sessions on track
- UI: cover, title → training hub, next session name, `completedCount/totalSessions`, progress bar, CTA

| Field | Source / href |
|-------|----------------|
| `trainingHref` | `/programs/{slug}/training` |
| `nextSessionHref` | `/programs/{slug}/play?session={sessionId}` |
| Progress tables | `program_runs`, `program_session_completions`, `program_sessions` / tracks |

Home Continue CTA currently goes to **`trainingHref`** (training hub), not directly to play — even when `nextSessionHref` is set. Label: “Continue training” when next session exists, else “Open program”.

### Enrollments (“My programs”)

`program_enrollments` where `status = 'active'`. Used for library ownership cards, separate from “started training” runs. Pro members may have empty enrollments while still accessing everything.

### Quick workouts

`programs` with `program_format = 'single_workout'`, first session → `/programs/{slug}/play?session={id}`.

---

## 6. Member AI coach (`?tab=custom`)

### Gate

`requireProMember()` in `member-coach-actions.ts` — signed in + `getHasActivePro`.

### Chat flow (high level)

1. Client loads catalog via `loadMemberCoachData` → programs catalog
2. User message → `sendMemberCoachMessage({ history, userMessage, programsCatalog })`
3. Intent / consultation may return **option chips** before tools
4. Context injected: profile AI context + active programs, enrollments, recent completions
5. Gemini via `chatWithAiCoach` with system prompt key `ai_member_coach_system`
6. Client renders text / consultation / recommendations / workout proposal

### Tools available to members

```ts
const MEMBER_TOOLS = ["recommend_programs", "generate_workout"];
// Not exposed: generate_program (admin only)
```

| Tool | Result | UI |
|------|--------|-----|
| `recommend_programs` | Program cards | Links to `/programs/{slug}` |
| `generate_workout` | `WorkoutProposal` | Phased exercise list → **Save & start workout** |

### Save workout

`saveMemberCoachWorkout` → `saveAiWorkoutProgram` (creates a program for the user) → returns `playHref` → **Start workout** CTA.

### Suggested prompts (client)

- “How am I doing in my current program?”
- “My shoulders feel tight after matches — what should I do?”
- “Build me a 30-minute home activation before padel.”
- “Which program should I follow for more power?”

Coach context sources: `profiles`, `program_runs`, `program_enrollments`, `program_session_completions`, locations, equipment, exercise catalog, programs catalog.

---

## 7. Profile / level / settings

### Display rows

Email, Name, Padel level, Top priority, Train usually, Padel pains / focus, Birth date, Gender.

### Editable (`ProfileEditSheet` → `updateMemberProfile`)

| Field | Stored as |
|-------|-----------|
| Display name | `profiles.full_name` |
| Level | `padel_levels` slug → `padel_level_id` |
| Pains | `padel_pains` |
| Goal | `primary_goal` |
| Environments | `training_environments` + primary `training_environment` |

Birth date / gender are shown but **not** in the edit sheet payload.

### Subscription settings CTAs

- Subscribe / Manage subscription (Stripe)
- Exercise library → `/member/exercises`
- View plans → `/member/upgrade`
- Promo banner when cookie present and not Pro

Onboarding itself lives at **`/onboarding`** (outside this hub); incomplete profiles never reach `/member`.

---

## 8. Promo banners, paywall, empty states

| Location | Condition | Copy / CTA |
|----------|-----------|------------|
| Home | `!hasActivePro` | “Unlock every program” → `/member/upgrade` |
| Home | Pro | Emerald active / renew strip |
| Custom | `!hasActivePro` | “Pro required” + Subscribe |
| Workouts / My | Pro, empty enrollments | “Pro includes every program” |
| Workouts / My | Free, empty | “No purchases yet” |
| Workouts / My | Free, has purchases | Upgrade footer |
| Home programs | empty / error | “No published programs yet” / error box |
| Blog | empty / error | Empty text / migration hint for `blog_posts` |
| Profile | `billing=success` | Subscription activating banner |
| Profile / Upgrade | promo cookie | Promo discount banner |
| Upgrade | `canceled=1` | Checkout canceled notice |
| Exercises | `!hasActivePro` | Pro paywall + Subscribe |

Promo source: `getStoredPromoCode()` (`src/lib/billing/promo-cookie-server.ts`).

---

## 9. Navigation out of `/member`

| From | Destination |
|------|-------------|
| Active program title / Continue | `/programs/{slug}/training` |
| Quick workout card | `/programs/{slug}/play?session={id}` |
| Latest / catalog program card | `/programs/{slug}` |
| Coach recommended program | `/programs/{slug}` |
| Coach saved workout | `/programs/{slug}/play?session={id}` |
| Blog section | `/blog`, `/blog/{slug}` |
| Upgrade CTAs | `/member/upgrade` |
| Profile | `/member/exercises`, Stripe checkout/portal |
| Sign out | `/` |

Workout player details: [`docs/taking-workouts.md`](./taking-workouts.md).

---

## 10. High-level architecture

```
/login → (auth) → /onboarding? → /member
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                  home          workouts         custom
                    │               │               │
              program_runs    catalog +        AI coach
              quick workouts  enrollments      (Pro)
                    │               │               │
                    └─────── /programs/{slug} ──────┘
                                 │
                    /training  or  /play?session=
```

---

## 11. Key files to open

**Routes / shell**

- `src/app/member/layout.tsx`
- `src/app/member/(shell)/page.tsx`
- `src/app/member/(shell)/upgrade/page.tsx`
- `src/app/member/(shell)/exercises/page.tsx`
- `src/lib/member/member-tabs.ts`
- `src/components/member/member-app-shell.tsx`
- `src/components/member/member-hub-loader.tsx`

**Tabs / UI**

- `src/components/member/member-home-tab.tsx`
- `src/app/member/(shell)/programs/member-programs-client.tsx`
- `src/components/member/member-custom-tab.tsx`
- `src/components/member/member-coach-client.tsx`
- `src/components/member/member-profile-tab.tsx`
- `src/components/member/profile-edit-sheet.tsx`
- `src/components/billing/subscription-settings.tsx`

**Data / Pro / progress**

- `src/lib/member/load-member-hub-data.ts`
- `src/lib/member/has-active-pro.ts`
- `src/lib/member/load-subscription-status.ts`
- `src/lib/member/member-shell-context.ts`
- `src/lib/programs/program-progress.ts`
- `src/lib/programs/program-routes.ts`

**Coach**

- `src/app/member/member-coach-actions.ts`
- `src/lib/programs/ai-coach-gemini.ts`
- `src/lib/programs/load-member-coach-context.ts`
- `src/lib/programs/coach-consultation.ts`

**Profile write**

- `src/app/member/profile-actions.ts`
- `src/lib/member/onboarding.ts` (level/goal/pain enums)

---

## 12. Quick reference — URLs

```
/member                         → home tab
/member?tab=workouts            → programs library
/member?tab=custom              → AI coach
/member?tab=profile             → subscription + profile
/member?tab=profile&billing=success
/member/upgrade                 → Pro plans (?canceled=1)
/member/exercises               → exercise library (Pro)
/member/programs|custom|profile → redirects to ?tab=…
/programs/{slug}                → program detail / access
/programs/{slug}/training       → training hub / progress
/programs/{slug}/play?session=  → workout player
```

---

## 13. Native implementation checklist

1. Gate: auth required; require `profiles.onboarding_completed_at`
2. Resolve Pro via `customer_subscriptions` + `grants_all_programs` (+ admin override)
3. Hub tabs: Home / Programs / Coach / Profile
4. Home: active `program_runs` progress, quick workouts, latest training plans, blog teaser
5. Programs: All catalog vs My enrollments
6. Coach: Pro-only; tools `recommend_programs` + `generate_workout`; save → play URL
7. Profile: subscription manage + editable training fields
8. Deep links: `/member?tab=…` and Stripe return with `billing=success`
9. Outbound: training hub, play session, program detail, upgrade
