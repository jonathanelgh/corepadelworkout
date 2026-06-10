export type ExerciseStatus = "draft" | "published";

export function parseExerciseStatus(raw: FormDataEntryValue | null | undefined): ExerciseStatus {
  const v = typeof raw === "string" ? raw.trim() : "";
  return v === "draft" ? "draft" : "published";
}
