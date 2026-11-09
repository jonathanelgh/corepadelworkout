/**
 * Flip to `true` when member AI coach is ready to ship.
 * Until then the Coach tab stays coming-soon, except for admins.
 */
export const MEMBER_AI_COACH_ENABLED = false;

export function isMemberAiCoachOpen(isAdmin: boolean): boolean {
  return MEMBER_AI_COACH_ENABLED || isAdmin;
}
