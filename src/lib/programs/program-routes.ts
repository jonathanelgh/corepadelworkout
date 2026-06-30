export function programTrainingHref(slug: string): string {
  return `/programs/${encodeURIComponent(slug)}/training`;
}

/** Marketing / info page (bypasses redirect to training hub). */
export function programInfoHref(slug: string): string {
  return `/programs/${encodeURIComponent(slug)}?view=info`;
}

export function programCatalogHref(slug: string): string {
  return `/programs/${encodeURIComponent(slug)}`;
}
