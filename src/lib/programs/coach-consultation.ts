import type { ChatHistoryMessage } from "@/lib/programs/ai-coach-gemini";
import { coachShouldCreateNew, coachShouldRecommendCatalogOnly } from "@/lib/programs/coach-intent";

export type MovementScreen = {
  squat: boolean;
  lunge: boolean;
  pushUp: boolean;
  jump: boolean;
};

export type ConsultationState = {
  goal?: string;
  locationSlug?: "home" | "gym" | "at-the-court";
  homeEquipment: string[];
  movementScreen?: MovementScreen;
  durationWeeks?: number;
  sessionsPerWeek?: number;
  minutes?: number;
};

const LOCATION_SLUGS = ["home", "gym", "at-the-court"] as const;

function allUserTexts(history: ChatHistoryMessage[], latest: string): string[] {
  const out: string[] = [];
  for (const m of history) {
    if (m.role === "user") out.push(m.parts[0].text.trim());
  }
  if (latest.trim()) out.push(latest.trim());
  return out;
}

export function lastAssistantText(history: ChatHistoryMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "model") return history[i].parts[0].text.trim();
  }
  return null;
}

export function coachWantsProgram(userTexts: string[]): boolean {
  const combined = userTexts.join(" ").toLowerCase();
  if (/\b\d+\s*(-|\s)?week/.test(combined)) return true;
  if (/\b(program|mesocycle|block)\b/.test(combined)) return true;
  if (/\b(workout|session|activation)\b/.test(combined) && !/\bprogram\b/.test(combined)) {
    return false;
  }
  return /\b(plan|routine)\b/.test(combined);
}

function parseLocation(texts: string[]): ConsultationState["locationSlug"] | undefined {
  for (const m of texts) {
    const t = m.trim().toLowerCase();
    if (/^(home|at home)$/i.test(t)) return "home";
    if (/^(gym|at the gym)$/i.test(t)) return "gym";
    if (/^(court|at the court|club)$/i.test(t)) return "at-the-court";
  }
  const combined = texts.join(" ").toLowerCase();
  if (/\b(at\s+)?home\b|\bhome\s+(workout|program|training)\b/.test(combined)) return "home";
  if (/\bgym\b/.test(combined)) return "gym";
  if (/\b(court|club|on[- ]court|at the court)\b/.test(combined)) return "at-the-court";
  return undefined;
}

function parseGoal(texts: string[]): string | undefined {
  for (const raw of texts) {
    const m = raw.trim();
    if (m.length < 12) continue;
    if (coachShouldCreateNew(m) || /\b(for|focus|strength|mobility|shoulder|movement|power|endurance|pre[- ]?match|injury|padel|durability)\b/i.test(m)) {
      return m;
    }
  }
  return undefined;
}

function parseWeeks(texts: string[]): number | undefined {
  for (const m of texts) {
    const match = m.match(/\b(\d{1,2})\s*(-|\s)?weeks?\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 52) return n;
    }
  }
  return undefined;
}

function parseSessionsPerWeek(texts: string[]): number | undefined {
  for (const m of texts) {
    let match = m.match(/\b(\d{1,2})\s*sessions?\s*(per|\/)\s*week\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 14) return n;
    }
    match = m.match(/\b(\d{1,2})\s*x\s*(per\s*)?week\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 14) return n;
    }
    match = m.match(/\b(\d{1,2})\s*\/\s*week\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 14) return n;
    }
  }
  return undefined;
}

function parseMinutes(texts: string[]): number | undefined {
  for (const m of texts) {
    const match = m.match(/\b(\d{1,3})\s*(-|\s)?min(?:ute)?s?\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 180) return n;
    }
    const bare = m.trim().match(/^(\d{1,3})$/);
    if (bare) {
      const n = Number.parseInt(bare[1]!, 10);
      if (n > 0 && n <= 180) return n;
    }
  }
  return undefined;
}

const MOVEMENT_KEYS = ["squat", "lunge", "pushUp", "jump"] as const;

const MOVEMENT_MATCHERS: Record<keyof MovementScreen, RegExp> = {
  squat: /\bsquats?\b/i,
  lunge: /\blunges?\b/i,
  pushUp: /\bpush[- ]?ups?\b/i,
  jump: /\b(jumps?|jumping|plyometrics?|plyo)\b/i,
};

function assistantAskedMovementScreen(lastAssistant: string | null): boolean {
  if (!lastAssistant) return false;
  const lower = lastAssistant.toLowerCase();
  return /\bsquats?\b/.test(lower) && /\blunges?\b/.test(lower) && /\bpush[- ]?ups?\b/.test(lower);
}

function movementMentionNegated(text: string, movement: keyof MovementScreen): boolean {
  const re = MOVEMENT_MATCHERS[movement];
  if (!re.test(text)) return false;

  const label =
    movement === "pushUp" ? "push[- ]?ups?" : movement === "jump" ? "jumps?" : `${movement}s?`;

  const negBefore = new RegExp(
    `\\b(no|not|can'?t|cannot|avoid|without|skip|don'?t|shouldn'?t)\\b[^.]{0,50}\\b${label}\\b`,
    "i"
  );
  const negAfter = new RegExp(
    `\\b${label}\\b[^.]{0,40}\\b(no|not|can'?t|cannot|avoid|off|out|pain)\\b`,
    "i"
  );
  const noJumping = movement === "jump" && /\bno jumping\b/i.test(text);

  return negBefore.test(text) || negAfter.test(text) || noJumping;
}

export function parseMovementScreen(
  texts: string[],
  lastAssistant: string | null
): MovementScreen | undefined {
  const combined = texts.join(" ").toLowerCase();
  const latest = texts[texts.length - 1]?.trim().toLowerCase() ?? "";
  const asked = assistantAskedMovementScreen(lastAssistant);

  if (
    /\b(yes to all|all good|all fine|all ok|everything(?:'s| is) fine|no restrictions|no limitations|cleared for all)\b/.test(
      combined
    ) ||
    (asked && /^(yes|yep|yeah|sure|all yes|affirmative)\.?$/i.test(latest))
  ) {
    return { squat: true, lunge: true, pushUp: true, jump: true };
  }

  const partial: Partial<MovementScreen> = {};
  for (const key of MOVEMENT_KEYS) {
    if (!MOVEMENT_MATCHERS[key].test(combined)) continue;
    partial[key] = !movementMentionNegated(combined, key);
  }

  if (Object.keys(partial).length === 0) return undefined;

  return {
    squat: partial.squat ?? true,
    lunge: partial.lunge ?? true,
    pushUp: partial.pushUp ?? true,
    jump: partial.jump ?? true,
  };
}

export function parseHomeEquipment(
  texts: string[],
  equipmentLibrary: string[]
): string[] {
  const combined = texts.join(" ").toLowerCase();
  const found = new Set<string>();

  if (
    /\b(bodyweight|body weight|no equipment|nothing|none)\b/.test(combined)
  ) {
    found.add("Bodyweight only");
  }

  for (const title of equipmentLibrary) {
    const t = title.toLowerCase();
    if (combined.includes(t)) found.add(title);
  }

  const aliases: [RegExp, string][] = [
    [/\bresistance bands?\b/, "Resistance bands"],
    [/\bbands?\b/, "Resistance bands"],
    [/\b(miniband|mini band|mini-band)\b/, "Resistance bands"],
    [/\bdumbbells?\b/, "Dumbbells"],
    [/\bkettlebells?\b/, "Kettlebell"],
    [/\b(kb|kbs)\b/, "Kettlebell"],
    [/\b(yoga )?mat\b/, "Yoga mat"],
    [/\bfoam roller\b/, "Foam roller"],
    [/\bmedicine balls?\b/, "Medicine ball"],
    [/\b(cable|pulley)\b/, "Cable machine"],
  ];

  for (const [re, label] of aliases) {
    if (re.test(combined)) {
      const libMatch = equipmentLibrary.find((e) => e.toLowerCase() === label.toLowerCase());
      found.add(libMatch ?? label);
    }
  }

  return [...found];
}

export function buildConsultationState(
  userTexts: string[],
  equipmentLibrary: string[],
  lastAssistant: string | null = null
): ConsultationState {
  return {
    goal: parseGoal(userTexts),
    locationSlug: parseLocation(userTexts),
    homeEquipment: parseHomeEquipment(userTexts, equipmentLibrary),
    movementScreen: parseMovementScreen(userTexts, lastAssistant),
    durationWeeks: parseWeeks(userTexts),
    sessionsPerWeek: parseSessionsPerWeek(userTexts),
    minutes: parseMinutes(userTexts),
  };
}

export function formatEquipmentQuestionExamples(equipmentLibrary: string[]): string {
  const picks = equipmentLibrary.slice(0, 8);
  const examples = [...picks, "bodyweight only"].join(", ");
  return examples;
}

export function nextConsultationQuestion(
  state: ConsultationState,
  isProgram: boolean,
  equipmentLibrary: string[]
): string | null {
  if (!state.goal) {
    return "What's the **main focus** for this plan? (e.g. strength, court movement, shoulder durability, pre-match activation)";
  }
  if (!state.locationSlug) {
    return "Where will they train — **home**, **gym**, or **at the court**?";
  }
  if (state.locationSlug === "home" && state.homeEquipment.length === 0) {
    const examples = formatEquipmentQuestionExamples(equipmentLibrary);
    return `What **equipment** is available **at home**? List what they have, or say **bodyweight only**.\n\nExamples: ${examples}`;
  }
  if (isProgram) {
    if (!state.movementScreen) {
      return "Can they **squat**, **lunge**, do **push-ups**, and **jump**? Reply **yes to all**, or list any movements they should **avoid**.";
    }
    if (!state.durationWeeks) {
      return "How many **weeks** should the program run?";
    }
    if (!state.sessionsPerWeek) {
      return "How many **sessions per week**?";
    }
    if (!state.minutes) {
      return "How long should **each workout session** be, in **minutes**?";
    }
  } else if (!state.minutes) {
    return "How long should the **workout** be, in **minutes**?";
  }
  return null;
}

function consultationHasProgress(state: ConsultationState): boolean {
  return Boolean(
    state.goal ||
      state.locationSlug ||
      state.homeEquipment.length > 0 ||
      state.movementScreen ||
      state.durationWeeks ||
      state.sessionsPerWeek ||
      state.minutes
  );
}

export function isConsultationComplete(
  state: ConsultationState,
  isProgram: boolean,
  equipmentLibrary: string[]
): boolean {
  return nextConsultationQuestion(state, isProgram, equipmentLibrary) === null;
}

export function shouldRunConsultation(
  history: ChatHistoryMessage[],
  userMessage: string
): boolean {
  if (coachShouldRecommendCatalogOnly(userMessage)) return false;

  const userTexts = allUserTexts(history, userMessage);
  const isProgram = coachWantsProgram(userTexts);
  const lastAssistant = lastAssistantText(history);
  const state = buildConsultationState(userTexts, [], lastAssistant);
  const next = nextConsultationQuestion(state, isProgram, []);

  if (next === null) return false;

  const hadCreateIntent = userTexts.some((t) => coachShouldCreateNew(t));
  const midFlow = lastAssistant?.includes("?") === true && consultationHasProgress(state);

  return hadCreateIntent || midFlow;
}

export function formatConsultationBrief(state: ConsultationState, isProgram: boolean): string {
  const lines: string[] = ["## Consultation answers (use these when generating)"];
  if (state.goal) lines.push(`- Focus / brief: ${state.goal}`);
  if (state.locationSlug) {
    const label =
      state.locationSlug === "home"
        ? "Home"
        : state.locationSlug === "gym"
          ? "Gym"
          : "At the court";
    lines.push(`- Training location: ${label} (location_slug: ${state.locationSlug})`);
  }
  if (state.locationSlug === "home" && state.homeEquipment.length > 0) {
    lines.push(
      `- Home equipment available: ${state.homeEquipment.join(", ")} — only prescribe exercises that fit this gear (see gear: in catalog) or true bodyweight moves`
    );
  }
  if (isProgram) {
    if (state.movementScreen) {
      const blocked: string[] = [];
      if (!state.movementScreen.squat) blocked.push("squats");
      if (!state.movementScreen.lunge) blocked.push("lunges");
      if (!state.movementScreen.pushUp) blocked.push("push-ups");
      if (!state.movementScreen.jump) blocked.push("jumping / plyometrics");
      if (blocked.length > 0) {
        lines.push(
          `- Movement restrictions: avoid ${blocked.join(", ")} — use regressions or alternatives from the catalog`
        );
      } else {
        lines.push("- Movement screen: cleared for squats, lunges, push-ups, and jumps");
      }
    }
    if (state.durationWeeks) lines.push(`- Duration: ${state.durationWeeks} weeks`);
    if (state.sessionsPerWeek) lines.push(`- Frequency: ${state.sessionsPerWeek} sessions per week`);
    if (state.minutes) lines.push(`- Target session length: ~${state.minutes} minutes per workout`);
  } else if (state.minutes) {
    lines.push(`- Target workout length: ~${state.minutes} minutes`);
  }
  if (state.locationSlug === "home" && state.homeEquipment.length === 0) {
    lines.push(
      "- WARNING: Home equipment not confirmed — do not generate until equipment is known."
    );
  }
  lines.push(
    "- Set generate_program location_slug to the training location above when building programs."
  );
  return lines.join("\n");
}

export function isValidLocationSlug(
  slug: string | undefined
): slug is NonNullable<ConsultationState["locationSlug"]> {
  return slug != null && (LOCATION_SLUGS as readonly string[]).includes(slug);
}
