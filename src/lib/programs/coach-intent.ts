/** Admin explicitly wants to browse existing catalog programs — not create new ones. */
export function coachShouldRecommendCatalogOnly(userMessage: string): boolean {
  const msg = userMessage.trim().toLowerCase();
  if (/\b(create|build|make|generate|draft|design|write|custom)\b/.test(msg)) {
    return false;
  }
  return (
    /\b(recommend|suggest|find|show|list|which|what)\b/.test(msg) &&
    /\b(programs?|workouts?|catalog|published|existing)\b/.test(msg)
  );
}

/** Single-session warm-up or pre-match routine — not a multi-week program. */
export function isQuickSingleWorkoutRequest(message: string): boolean {
  const msg = message.trim().toLowerCase();
  if (/\b(\d+\s*(-|\s)?week|program|mesocycle|block)\b/.test(msg)) return false;
  if (/\b(warm[- ]?up|pre[- ]?match|before\s+(a\s+)?match|activation)\b/.test(msg)) return true;
  if (
    /\b\d+\s*(-|\s)?min(?:ute)?s?\b/.test(msg) &&
    /\b(warm[- ]?up|workout|session|activation|cool[- ]?down)\b/.test(msg) &&
    !/\bprogram\b/.test(msg)
  ) {
    return true;
  }
  return false;
}

/** Admin wants a new custom program or workout built from the exercise library. */
export function coachShouldCreateNew(userMessage: string): boolean {
  if (coachShouldRecommendCatalogOnly(userMessage)) return false;

  const msg = userMessage.trim().toLowerCase();
  if (/\b(create|build|make|generate|draft|design|write)\b/.test(msg)) return true;
  if (/\bcustom\b/.test(msg) && /\b(program|workout|plan|routine)\b/.test(msg)) return true;
  if (/\b(warm[- ]?up|pre[- ]?match|activation)\b/.test(msg)) return true;
  if (/\b\d+\s*(-|\s)?week/.test(msg) && /\b(program|plan)\b/.test(msg)) return true;
  if (
    /\b\d+\s*(-|\s)?min(ute)?s?\b/.test(msg) &&
    /\b(workout|session|activation|warm[- ]?up)\b/.test(msg)
  ) {
    return true;
  }
  return false;
}
