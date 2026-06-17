import { ChevronDown } from "lucide-react";
import {
  EXERCISE_PROGRAM_PRESCRIPTION_MODE_OPTIONS,
  type ExerciseProgramPrescriptionMode,
} from "@/lib/exercises/program-prescription-mode";

export function ExerciseProgramPrescriptionModeField({
  defaultValue = "all",
  disabled = false,
}: {
  defaultValue?: ExerciseProgramPrescriptionMode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor="program_prescription_mode" className="mb-1.5 block text-sm font-medium text-gray-700">
        In programs
      </label>
      <div className="relative max-w-xl">
        <select
          id="program_prescription_mode"
          name="program_prescription_mode"
          defaultValue={defaultValue}
          disabled={disabled}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
        >
          {EXERCISE_PROGRAM_PRESCRIPTION_MODE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {
          EXERCISE_PROGRAM_PRESCRIPTION_MODE_OPTIONS.find((o) => o.id === defaultValue)?.hint ??
          EXERCISE_PROGRAM_PRESCRIPTION_MODE_OPTIONS[0]!.hint
        }
      </p>
    </div>
  );
}
