-- Allow Pro members to save AI coach single-workout programs they create.

alter table public.programs
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;

comment on column public.programs.created_by_user_id is
  'When set, this program was created by a member (e.g. AI coach custom workout).';

create index if not exists programs_created_by_user_id_idx
  on public.programs (created_by_user_id)
  where created_by_user_id is not null;

create or replace function public.user_has_active_pro(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.customer_subscriptions cs
      inner join public.subscription_plans sp on sp.id = cs.plan_id
      where cs.user_id = p_user_id
        and sp.grants_all_programs = true
        and cs.status in ('active', 'trialing')
        and cs.current_period_end > now()
    );
$$;

comment on function public.user_has_active_pro(uuid) is
  'True when user is admin or has an active Pro subscription.';

revoke all on function public.user_has_active_pro(uuid) from public;
grant execute on function public.user_has_active_pro(uuid) to authenticated;

create or replace function public.program_is_member_single_workout(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.programs p
    where p.id = p_program_id
      and p.created_by_user_id is not null
      and p.program_format = 'single_workout'
  );
$$;

revoke all on function public.program_is_member_single_workout(uuid) from public;
grant execute on function public.program_is_member_single_workout(uuid) to authenticated;

-- programs
create policy "Pro members insert own single workouts"
  on public.programs for insert
  to authenticated
  with check (
    created_by_user_id = auth.uid()
    and program_format = 'single_workout'
    and public.user_has_active_pro(auth.uid())
  );

create policy "Pro members update own single workouts"
  on public.programs for update
  to authenticated
  using (
    created_by_user_id = auth.uid()
    and program_format = 'single_workout'
    and public.user_has_active_pro(auth.uid())
  )
  with check (
    created_by_user_id = auth.uid()
    and program_format = 'single_workout'
  );

-- program_location_tracks
create policy "Pro members insert tracks for own single workouts"
  on public.program_location_tracks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_id
        and p.created_by_user_id = auth.uid()
        and p.program_format = 'single_workout'
    )
    and public.user_has_active_pro(auth.uid())
  );

-- program_sessions
create policy "Pro members insert sessions for own single workouts"
  on public.program_sessions for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.program_location_tracks plt
      inner join public.programs p on p.id = plt.program_id
      where plt.id = track_id
        and p.created_by_user_id = auth.uid()
        and p.program_format = 'single_workout'
    )
    and public.user_has_active_pro(auth.uid())
  );

-- program_exercises
create policy "Pro members insert exercises for own single workouts"
  on public.program_exercises for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.program_sessions ps
      inner join public.program_location_tracks plt on plt.id = ps.track_id
      inner join public.programs p on p.id = plt.program_id
      where ps.id = session_id
        and p.created_by_user_id = auth.uid()
        and p.program_format = 'single_workout'
    )
    and public.user_has_active_pro(auth.uid())
  );

-- member coach system prompt
insert into public.ai_prompts (key, label, description, body)
values (
  'ai_member_coach_system',
  'Member AI Coach — system prompt',
  'Chat coach for /member?tab=custom (Pro members).',
  $prompt$You are the Core Padel AI Coach — a warm, expert padel strength and conditioning coach speaking directly to the athlete in a 1:1 conversation.

{{user_context_block}}{{training_context_block}}

## Your role
- Be a **real coach**: answer questions about padel fitness, strength, mobility, recovery, injury prevention, match prep, and training habits. Not only program building.
- Use their **profile**, **onboarding level**, **active programs**, and **workout log** above. Reference what they are doing — ask how sessions felt, notice consistency or gaps, coach around their schedule.
- Speak with **you/your**. Supportive, direct, practical. No cheerleading filler ("great idea", "fantastic", "perfect").
- Use markdown for replies (no HTML). Keep answers focused unless they ask for depth.

## Tools — when to use
- **Text only** — general coaching, education, check-ins, discussing soreness, progress, or program questions. Default mode.
- **recommend_programs** — when they want program ideas from the published library (multi-week plans, structured blocks). You cannot author new catalog programs.
- **generate_workout** — when they want a **custom single session** built for them. Gather goal, location/equipment, and duration first (one question at a time) if missing.

Do not call tools for casual conversation. Never call generate_program.

## Consultation (custom workouts only)
- One short follow-up question per turn when details are missing.
- Do not generate until you know: focus/goal, training location (home / gym / at the court), and for **home** — available equipment. Confirm **session length in minutes**.
- A private **consultation_state** block may guide you — use it silently; never expose it in your reply.

## Generation rules
- For generate_workout: warm-up, main (include rotation or anti-rotation), cool-down; phase on every exercise.
- Use ONLY exercises from the catalog below. Copy exercise_id UUIDs exactly.
- REQUIRED: at least one rotational or anti-rotational exercise in the main block.
- Prescription rest: sets+reps → rest_after_seconds 30–60s main; timed work → 20–45s; timed sets → rest_between_sets_seconds + rest_after_seconds.
- Coach **note** on exercises when useful (5–10% load increase; both_sides timing).

{{methodology_block}}

Published programs catalog (id must be copied exactly for recommend_programs):
{{programs_catalog}}

Exercise catalog ({{exercise_count}} published exercises — exercise_id must be copied exactly):
{{exercise_catalog}}$prompt$
)
on conflict (key) do nothing;
