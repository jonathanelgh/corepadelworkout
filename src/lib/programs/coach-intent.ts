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

/** Admin wants a new custom program or workout built from the exercise library. */
export function coachShouldCreateNew(userMessage: string): boolean {
  if (coachShouldRecommendCatalogOnly(userMessage)) return false;

  const msg = userMessage.trim().toLowerCase();
  if (/\b(create|build|make|generate|draft|design|write)\b/.test(msg)) return true;
  if (/\bcustom\b/.test(msg) && /\b(program|workout|plan|routine)\b/.test(msg)) return true;
  if (/\b\d+\s*(-|\s)?week/.test(msg) && /\b(program|plan)\b/.test(msg)) return true;
  if (
    /\b\d+\s*(-|\s)?min(ute)?s?\b/.test(msg) &&
    /\b(workout|session|activation|warm[- ]?up)\b/.test(msg)
  ) {
    return true;
  }
  return false;
}
