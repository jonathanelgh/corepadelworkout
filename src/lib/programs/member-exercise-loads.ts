import type { SupabaseClient } from "@supabase/supabase-js";

export type WeightUnit = "kg" | "lb";

export type MemberExerciseLoad = {
  exerciseId: string;
  weightValue: number;
  weightUnit: WeightUnit;
};

export function isWeightUnit(v: unknown): v is WeightUnit {
  return v === "kg" || v === "lb";
}

export async function fetchMemberExerciseLoads(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds: string[]
): Promise<Record<string, MemberExerciseLoad>> {
  const ids = [...new Set(exerciseIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from("member_exercise_loads")
    .select("exercise_id, weight_value, weight_unit")
    .eq("user_id", userId)
    .in("exercise_id", ids);

  if (error) throw new Error(error.message);

  const out: Record<string, MemberExerciseLoad> = {};
  for (const row of data ?? []) {
    const exerciseId = row.exercise_id as string;
    const weightValue = Number(row.weight_value);
    const weightUnit = isWeightUnit(row.weight_unit) ? row.weight_unit : "kg";
    if (!exerciseId || !Number.isFinite(weightValue) || weightValue <= 0) continue;
    out[exerciseId] = { exerciseId, weightValue, weightUnit };
  }
  return out;
}

export async function upsertMemberExerciseLoad(
  supabase: SupabaseClient,
  input: {
    userId: string;
    exerciseId: string;
    programId: string;
    sessionId: string;
    programExerciseId?: string | null;
    weightValue: number;
    weightUnit: WeightUnit;
  }
): Promise<void> {
  const now = new Date().toISOString();

  const { error: sessionErr } = await supabase.from("member_session_exercise_loads").upsert(
    {
      user_id: input.userId,
      program_id: input.programId,
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      program_exercise_id: input.programExerciseId?.trim() || null,
      weight_value: input.weightValue,
      weight_unit: input.weightUnit,
      logged_at: now,
    },
    { onConflict: "user_id,session_id,exercise_id" }
  );
  if (sessionErr) throw new Error(sessionErr.message);

  const { error: lastErr } = await supabase.from("member_exercise_loads").upsert(
    {
      user_id: input.userId,
      exercise_id: input.exerciseId,
      weight_value: input.weightValue,
      weight_unit: input.weightUnit,
      updated_at: now,
    },
    { onConflict: "user_id,exercise_id" }
  );
  if (lastErr) throw new Error(lastErr.message);
}
