"use client";

import { Trash2 } from "lucide-react";
import { deleteProgram } from "./actions";

export function DeleteProgramButton({
  programId,
  programTitle,
}: {
  programId: string;
  programTitle: string;
}) {
  return (
    <form action={deleteProgram} className="inline">
      <input type="hidden" name="program_id" value={programId} />
      <button
        type="submit"
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors inline-flex"
        title="Delete"
        aria-label={`Delete program ${programTitle}`}
        onClick={(e) => {
          if (
            !confirm(
              `Delete "${programTitle}"? This removes the program, curriculum, and enrollments tied to it. This cannot be undone.`
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}
