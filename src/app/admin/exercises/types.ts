export type ExerciseListItem = {
  id: string;
  title: string;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
  location_id: string;
  created_at: string;
  locationName: string | null;
  equipmentIds: string[];
  categoryTypeIds: string[];
  movementPatternIds: string[];
  bodyRegionIds: string[];
  bodyPartIds: string[];
  exerciseLevelId: string | null;
};
