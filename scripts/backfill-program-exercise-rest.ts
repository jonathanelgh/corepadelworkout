#!/usr/bin/env npx tsx
/**
 * Backfill missing rest_after_seconds and rest_between_sets_seconds on program_exercises.
 *
 * Uses the same defaults as AI coach generation (normalize-ai-exercise-prescription).
 *
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-program-exercise-rest.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/backfill-program-exercise-rest.ts
 */

import { createClient } from "@supabase/supabase-js";
import { backfillStoredProgramExerciseRest } from "../src/lib/programs/normalize-ai-exercise-prescription";

type ProgramExerciseRow = {
  id: string;
  session_id: string;
  sort_order: number;
  duration_minutes: number | null;
  duration_seconds: number | null;
  sets: number | null;
  reps: number | null;
  rest_between_sets_seconds: number | null;
  rest_after_seconds: number | null;
  session_phase: string | null;
};

function parseArgs(argv: string[]) {
  return { dryRun: argv.includes("--dry-run") };
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("program_exercises")
    .select(
      "id, session_id, sort_order, duration_minutes, duration_seconds, sets, reps, rest_between_sets_seconds, rest_after_seconds, session_phase"
    )
    .order("session_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load program_exercises:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as ProgramExerciseRow[];
  const bySession = new Map<string, ProgramExerciseRow[]>();
  for (const row of rows) {
    const list = bySession.get(row.session_id) ?? [];
    list.push(row);
    bySession.set(row.session_id, list);
  }

  let scanned = 0;
  let updated = 0;
  let restAfterFilled = 0;
  let restBetweenFilled = 0;

  for (const sessionRows of bySession.values()) {
    sessionRows.sort((a, b) => a.sort_order - b.sort_order);
    const lastIndex = sessionRows.length - 1;

    for (let i = 0; i < sessionRows.length; i++) {
      const row = sessionRows[i]!;
      scanned += 1;

      const result = backfillStoredProgramExerciseRest(row, {
        isLastInSession: i === lastIndex,
      });
      if (!result.needsUpdate) continue;

      const patch: {
        rest_after_seconds?: number;
        rest_between_sets_seconds?: number | null;
      } = {};

      const hadRestAfter = row.rest_after_seconds != null && row.rest_after_seconds > 0;
      const hadRestBetween =
        row.rest_between_sets_seconds != null && row.rest_between_sets_seconds > 0;

      if (!hadRestAfter && i < lastIndex && result.rest_after_seconds > 0) {
        patch.rest_after_seconds = result.rest_after_seconds;
        restAfterFilled += 1;
      }
      if (!hadRestBetween && result.rest_between_sets_seconds != null && result.rest_between_sets_seconds > 0) {
        patch.rest_between_sets_seconds = result.rest_between_sets_seconds;
        restBetweenFilled += 1;
      }

      if (Object.keys(patch).length === 0) continue;

      updated += 1;
      const label = `session=${row.session_id.slice(0, 8)}… sort=${row.sort_order} id=${row.id.slice(0, 8)}…`;
      const parts: string[] = [];
      if (patch.rest_after_seconds != null) {
        parts.push(`rest_after: ${row.rest_after_seconds ?? "null"} → ${patch.rest_after_seconds}`);
      }
      if (patch.rest_between_sets_seconds != null) {
        parts.push(
          `rest_between: ${row.rest_between_sets_seconds ?? "null"} → ${patch.rest_between_sets_seconds}`
        );
      }
      console.log(`${dryRun ? "DRY   " : "UPDATE"} ${label} — ${parts.join(", ")}`);

      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from("program_exercises")
          .update(patch)
          .eq("id", row.id);
        if (updateErr) {
          console.error(`FAIL  ${row.id} — ${updateErr.message}`);
          process.exit(1);
        }
      }
    }
  }

  console.log("\nDone.");
  console.log(`  scanned:              ${scanned}`);
  console.log(`  rows updated:         ${updated}`);
  console.log(`  rest_after filled:    ${restAfterFilled}`);
  console.log(`  rest_between filled:  ${restBetweenFilled}`);
  if (dryRun) console.log("  (dry run — no writes)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
