import type { ExerciseStatus } from "@/lib/exercises/status";
import type { ExerciseProgramPrescriptionMode } from "@/lib/exercises/program-prescription-mode";

export type ExerciseListItem = {
  id: string;
  title: string;
  status: ExerciseStatus;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
  location_id: string;
  locationIds: string[];
  created_at: string;
  locationName: string | null;
  locationNames: string[];
  equipmentIds: string[];
  /** Resolved titles from `equipment` for display (order matches selection). */
  equipmentLabels: string[];
  categoryTypeIds: string[];
  movementPatternIds: string[];
  bodyRegionIds: string[];
  bodyPartIds: string[];
  exerciseLevelId: string | null;
  exerciseLevelLabel: string | null;
  programPrescriptionMode: ExerciseProgramPrescriptionMode;
  bothSides: boolean;
  categoryTypeLabels: string[];
  movementPatternLabels: string[];
  bodyRegionLabels: string[];
  bodyPartLabels: string[];
};

export type ExerciseFilterOption = { id: string; label: string };

export type ExerciseListFilters = {
  locations: ExerciseFilterOption[];
  equipment: ExerciseFilterOption[];
  levels: ExerciseFilterOption[];
  categoryTypes: ExerciseFilterOption[];
  movementPatterns: ExerciseFilterOption[];
  bodyRegions: ExerciseFilterOption[];
  bodyParts: ExerciseFilterOption[];
};
