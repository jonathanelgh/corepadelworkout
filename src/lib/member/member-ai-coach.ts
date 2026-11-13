/**
 * When true, the member Coach tab is available to signed-in members
 * (Pro required for generation; free members see the upgrade prompt).
 * Admins always have access even if this is false.
 */
export const MEMBER_AI_COACH_ENABLED = true;

export function isMemberAiCoachOpen(isAdmin: boolean): boolean {
  return MEMBER_AI_COACH_ENABLED || isAdmin;
}
