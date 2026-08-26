/** Detect RPE language in free text (coach notes / intensity). */
export function textMentionsRpe(text: string | null | undefined): boolean {
  return /\brpe\b/i.test(text?.trim() || "");
}

/**
 * Pull an RPE target like "7", "7-8", or "6–7" from a structured field or note.
 * Strips optional "/10" suffixes.
 */
export function extractRpeValue(text: string | null | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;

  const fromCue = t.match(
    /\brpe\s*[: ]?\s*(\d+(?:\s*[-–—/]\s*\d+)?)(?:\s*\/\s*10)?/i
  );
  if (fromCue?.[1]) {
    return normalizeRpeDigits(fromCue[1]);
  }

  // Structured field is often just "7" or "8-9".
  if (/^\d+(?:\s*[-–—/]\s*\d+)?(?:\s*\/\s*10)?$/i.test(t)) {
    return normalizeRpeDigits(t.replace(/\s*\/\s*10$/i, ""));
  }

  return null;
}

function normalizeRpeDigits(raw: string): string {
  return raw
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

/** Prefer structured rpe, then note, then intensity. */
export function resolveExerciseRpe(opts: {
  rpe?: string | null;
  intensity?: string | null;
  note?: string | null;
}): string | null {
  return (
    extractRpeValue(opts.rpe) ??
    extractRpeValue(opts.note) ??
    extractRpeValue(opts.intensity)
  );
}

/**
 * When a dedicated RPE badge is shown, drop matching "RPE 7–8" cues from the note
 * so athletes don't see the same target twice.
 */
export function noteWithoutLeadingRpeCue(
  note: string | null | undefined,
  rpeLabel: string | null | undefined
): string | null {
  const raw = note?.trim();
  if (!raw) return null;
  if (!rpeLabel?.trim()) return raw;

  const escaped = rpeLabel
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/-/g, "[-–—]");
  const cue = new RegExp(
    `\\brpe\\s*[: ]?\\s*${escaped}(?:\\s*/\\s*10)?\\.?`,
    "gi"
  );
  const stripped = raw
    .replace(cue, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.;,!?])/g, "$1")
    .replace(/^[.;,\s]+|[.;,\s]+$/g, "")
    .trim();
  return stripped || null;
}
