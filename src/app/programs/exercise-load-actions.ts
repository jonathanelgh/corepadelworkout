"use server";

import { createClient } from "@/utils/supabase/server";
import {
  isWeightUnit,
  upsertMemberExerciseLoad,
  type WeightUnit,
} from "@/lib/programs/member-exercise-loads";

export type SaveExerciseLoadResult = { ok: true } | { error: string };

export async function saveExerciseLoad(input: {
  exerciseId: string;
  programId: string;
  sessionId: string;
  programExerciseId?: string | null;
  weightValue: number;
  weightUnit: WeightUnit;
}): Promise<SaveExerciseLoadResult> {
  const exerciseId = input.exerciseId?.trim() ?? "";
  const programId = input.programId?.trim() ?? "";
  const sessionId = input.sessionId?.trim() ?? "";
  if (!exerciseId || !programId || !sessionId) {
    return { error: "Missing exercise or session." };
  }

  const weightValue = Number(input.weightValue);
  if (!Number.isFinite(weightValue) || weightValue <= 0) {
    return { error: "Enter a valid weight greater than 0." };
  }
  if (!isWeightUnit(input.weightUnit)) {
    return { error: "Invalid weight unit." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  try {
    await upsertMemberExerciseLoad(supabase, {
      userId: user.id,
      exerciseId,
      programId,
      sessionId,
      programExerciseId: input.programExerciseId,
      weightValue,
      weightUnit: input.weightUnit,
    });
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save weight." };
  }
}
