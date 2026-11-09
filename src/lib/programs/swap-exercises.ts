export type SwapExerciseOption = {
  id: string;
  title: string;
  categories: string[];
  imageUrl: string | null;
  videoUrl: string | null;
};

/** Exercises that share the source exercise's first category, minus ones already in the workout. */
export function filterSwapExercises(input: {
  options: SwapExerciseOption[];
  sourceCategories: string[];
  query: string;
  excludeIds: string[];
}): SwapExerciseOption[] {
  const exclude = new Set(input.excludeIds);
  const query = input.query.trim().toLowerCase();
  const category = input.sourceCategories.map((item) => item.trim()).find((item) => item.length > 0) ?? "";
  const categoryKey = category.toLowerCase();

  return input.options.filter((option) => {
    if (exclude.has(option.id)) return false;
    if (categoryKey) {
      const shares = option.categories.some((item) => item.trim().toLowerCase() === categoryKey);
      if (!shares) return false;
    }
    if (query && !option.title.toLowerCase().includes(query)) return false;
    return true;
  });
}
