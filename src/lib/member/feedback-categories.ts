export const FEEDBACK_CATEGORIES = [
  "good",
  "bad",
  "idea",
  "general",
  "bug",
  "program",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export function isFeedbackCategory(value: string): value is FeedbackCategory {
  return (FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}
