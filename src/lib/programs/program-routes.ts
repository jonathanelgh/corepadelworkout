export function programTrainingHref(slug: string): string {
  return `/programs/${encodeURIComponent(slug)}/training`;
}

/** Day overview before the workout player (equipment, exercise list, Start). */
export function programDayHref(slug: string, sessionId: string): string {
  return `/programs/${encodeURIComponent(slug)}/training/day/${encodeURIComponent(sessionId)}`;
}

/** Marketing / info page (bypasses redirect to training hub). */
export function programInfoHref(slug: string): string {
  return `/programs/${encodeURIComponent(slug)}?view=info`;
}

export function programCatalogHref(slug: string): string {
  return `/programs/${encodeURIComponent(slug)}`;
}
