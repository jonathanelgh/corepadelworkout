-- Document automatic weekly progression in AI prompts (enforced in code on save).

update public.ai_prompts
set body = body || E'

### Weekly progression (automatic on save)

- Return **week-1 session templates only** (`sessions_per_week` entries). The app repeats them for `duration_weeks` and **applies progression each week** — you do not need duplicate sessions in `sessions[]`.
- Week 1 = your template as written. Later weeks auto-adjust in the app:
  - **Rep weeks:** +1 rep on main strength exercises (sets/reps).
  - **Set weeks:** +1 set on main strength exercises (max 6 sets).
  - **Load / time weeks:** coach note to increase load 5–10%, or +10s on timed main work.
- Warm-up stays **60s per exercise every week** — do not progress warm-up duration.
- Keep the **same core exercises** across the block; progression changes prescription, not exercise selection.'
where key in ('ai_coach_system', 'ai_program_builder')
  and body not like '%Weekly progression (automatic on save)%';
