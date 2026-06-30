import type { SessionPayload, TrackPayload } from "@/lib/programs/program-curriculum";

/** Same grouping as create-program-form `resolveWeekSizes` (uniform frequency). */
export function resolveWeekSizesFromSchedule(
  sessionCount: number,
  sessionsPerWeek: number
): number[] {
  const perWeek = Math.max(1, Math.floor(sessionsPerWeek) || 1);
  const sizes: number[] = [];
  for (let i = 0; i < sessionCount; i += perWeek) {
    sizes.push(Math.min(perWeek, sessionCount - i));
  }
  return sizes.length > 0 ? sizes : [Math.max(1, sessionCount)];
}

/** Manual program builder names sessions Day 1, Day 2, … globally. */
export function normalizeTrainingPlanSessionNames(
  sessions: SessionPayload[]
): SessionPayload[] {
  return sessions.map((session, index) => ({
    ...session,
    name: `Day ${index + 1}`,
  }));
}

export function buildTrainingPlanTrack(
  locationId: string,
  sessions: SessionPayload[],
  sessionsPerWeek: number
): TrackPayload {
  const week_sizes = resolveWeekSizesFromSchedule(sessions.length, sessionsPerWeek);
  return {
    location_id: locationId,
    week_sizes,
    sessions,
  };
}
