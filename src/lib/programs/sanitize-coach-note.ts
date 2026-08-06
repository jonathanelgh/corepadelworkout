/**
 * Progression belongs in structured fields (sets, reps, load_prescription, duration).
 * Strip coach-note text that tells the athlete to increase load/reps/sets week to week.
 */

const PROGRESSION_NOTE_PATTERNS: RegExp[] = [
  /\bincrease\s+(the\s+)?(weight|load|reps?|sets?|duration|time)\b/i,
  /\badd\s+(more\s+)?(weight|load)\b/i,
  /\badd\s+\d+\s*(kg|lb|lbs|reps?|sets?)\b/i,
  /\b(add|use)\s+(heavier|more)\s+(weight|load)\b/i,
  /\b(progress|progression)\s+(by|with|to|the)\b/i,
  /\b\+?\s*\d+\s*([-–—]\s*\d+)?\s*%\s*(each|per|every)?\s*(week|session)?\b/i,
  /\b(5|10)\s*([-–—]\s*(5|10))?\s*%\s*(load|weight|increase)?\b/i,
  /\bweek\s*(to|-)?\s*week\b.*\b(increase|progress|add)\b/i,
  /\b(increase|progress|add).*\bweek\s*(to|-)?\s*week\b/i,
  /\bprogressive\s+overload\b/i,
  /\bheavier\s+(each|every|next)\s+week\b/i,
  /\bmore\s+reps?\s+(each|every|next)\s+week\b/i,
  /\badd\s+a\s+set\b/i,
  /\bwhen\s+ready,?\s+increase\b/i,
  /^\s*add\s+weight\.?\s*$/i,
];

/**
 * Both-sides behavior is driven ONLY by `exercises.both_sides`.
 * Strip AI coach-note cues that invent bilateral work for unmarked exercises.
 * Also drop redundant "both sides" cues when the catalog flag already handles it.
 */
const BOTH_SIDES_NOTE_PATTERNS: RegExp[] = [
  /\bperform\s+\d+\s+reps?\s+per\s+side\.?/gi,
  /\b(do|perform|complete|repeat)\s+(on\s+)?both\s+sides\.?/gi,
  /\b\d+\s+reps?\s+(per|each)\s+side\.?/gi,
  /\breps?\s+(per|each)\s+side\.?/gi,
  /\b(per|each)\s+side\.?/gi,
  /\bon\s+both\s+sides\.?/gi,
  /\bboth\s+sides\.?/gi,
  /\bleft\s*(?:then|&|\/|,)\s*right\.?/gi,
  /\bL\s*[/|]\s*R\.?/gi,
];

/** Detect a numeric load mention like "12 kg" or "25lb" in free text. */
export function extractLoadFromText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|lb|lbs)\b/i);
  if (!match) return null;
  const amount = match[1]!;
  const unit = match[2]!.toLowerCase().startsWith("k") ? "kg" : "lb";
  return `${amount} ${unit}`;
}

export function noteLooksLikeProgression(text: string | null | undefined): boolean {
  const t = text?.trim();
  if (!t) return false;
  return PROGRESSION_NOTE_PATTERNS.some((re) => re.test(t));
}

/**
 * Remove progression sentences from a coach note. Returns null if nothing useful remains.
 */
export function sanitizeCoachNote(note: string | null | undefined): string | null {
  const raw = note?.trim();
  if (!raw) return null;

  const parts = raw
    .split(/(?<=[.!?])\s+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const kept = parts.filter((p) => !noteLooksLikeProgression(p));
  if (kept.length === 0) {
    // Whole note was progression — drop it.
    if (noteLooksLikeProgression(raw)) return null;
    return raw;
  }

  const out = kept.join(" ").trim();
  return out || null;
}

/**
 * Remove both-sides instructional language from notes.
 * Always strip invented bilateral cues; the catalog `both_sides` flag owns that UX.
 */
export function sanitizeBothSidesCoachNote(
  note: string | null | undefined,
  _opts?: { bothSides?: boolean }
): string | null {
  const raw = note?.trim();
  if (!raw) return null;

  let out = raw;
  for (const re of BOTH_SIDES_NOTE_PATTERNS) {
    out = out.replace(re, " ");
  }
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/^[.,;:\s]+|[.,;:\s]+$/g, "")
    .trim();

  return out || null;
}

export type PrescriptionFields = {
  note?: string | null;
  load_prescription?: string | null;
};

/**
 * Move progression out of notes into load_prescription when possible; strip progression prose.
 */
export function promoteProgressionOutOfNote<T extends PrescriptionFields>(ex: T): T {
  const cleanedNote = sanitizeCoachNote(ex.note);
  let load = ex.load_prescription?.trim() || null;

  if (!load && ex.note?.trim()) {
    const extracted = extractLoadFromText(ex.note);
    if (extracted) load = extracted;
  }

  return {
    ...ex,
    note: cleanedNote,
    load_prescription: load,
  };
}
