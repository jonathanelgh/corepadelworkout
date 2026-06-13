import type { ExerciseStatus } from "@/lib/exercises/status";

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
};
