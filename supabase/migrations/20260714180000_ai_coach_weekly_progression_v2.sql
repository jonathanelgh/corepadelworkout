-- Refresh weekly progression guidance: prescriptions are scaled in code (~10%/week).

update public.ai_prompts
set body = regexp_replace(
  body,
  '### Weekly progression \(automatic on save\)[\s\S]*?progression changes prescription, not exercise selection\.',
  '### Weekly progression (automatic on save)

- Return **week-1 session templates only** (`sessions_per_week` entries). The app repeats them for `duration_weeks` and **writes progressed prescriptions into each week''s sessions** — do not duplicate sessions in `sessions[]`.
- Week 1 = your template as written. Each later week auto-applies **~10% progression** on the same exercises:
  - **Reps** increase (~10% per week, rounded).
  - **Timed work** increases (~10% per week, rounded to 5s).
  - **Sets** increase when the rounded 10% crosses the next whole set (max 6).
  - **Load:** set `load_prescription` on week 1 for weighted moves (e.g. `"12 kg"`, `"20 lb"`); later weeks scale the number automatically.
- Do **not** tell the athlete to increase load in `note` — the app handles load/reps/time in the prescription.
- Warm-up stays **60s per exercise every week** — do not progress warm-up duration.
- Keep the **same core exercises** across the block; progression changes prescription, not exercise selection.',
  'g'
)
where key in ('ai_coach_system', 'ai_program_builder')
  and body like '%Weekly progression (automatic on save)%';
