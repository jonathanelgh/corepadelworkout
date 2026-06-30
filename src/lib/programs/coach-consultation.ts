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

export type ConsultationLocationOption = {
  id: string;
  name: string;
  slug: string;
};

export type ConsultationTopic =
  | "location"
  | "equipment"
  | "movement"
  | "weeks"
  | "sessions"
  | "minutes";

export type ConsultationPromptOption = {
  id: string;
  label: string;
  value: string;
};

export type ConsultationPrompt = {
  topic: ConsultationTopic;
  question: string;
  options: ConsultationPromptOption[];
  multiSelect?: boolean;
};

const LOCATION_SLUGS = ["home", "gym", "at-the-court"] as const;

const DEFAULT_LOCATIONS: ConsultationLocationOption[] = [
  { id: "gym", name: "Gym", slug: "gym" },
  { id: "home", name: "Home", slug: "home" },
  { id: "at-the-court", name: "At the court", slug: "at-the-court" },
];

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

function parseLocationAnswer(
  text: string,
  locations: ConsultationLocationOption[]
): ConsultationState["locationSlug"] | undefined {
  const t = text.trim().toLowerCase();
  for (const loc of locations) {
    if (t === loc.slug || t === loc.name.toLowerCase()) {
      return loc.slug as ConsultationState["locationSlug"];
    }
  }
  if (/^(court|club|at the court)$/.test(t)) {
    const court = locations.find((l) => l.slug === "at-the-court");
    if (court) return "at-the-court";
  }
  if (/^(gym|at the gym)$/.test(t)) {
    const gym = locations.find((l) => l.slug === "gym");
    if (gym) return "gym";
  }
  if (/^(home|at home)$/.test(t)) {
    const home = locations.find((l) => l.slug === "home");
    if (home) return "home";
  }
  return undefined;
}

function findConsultationStartIndex(
  userTexts: string[],
  history: ChatHistoryMessage[],
  latestUserMessage: string
): number {
  for (let i = 0; i < userTexts.length; i++) {
    if (coachShouldCreateNew(userTexts[i]!)) return i;
  }
  if (userTexts.length > 0 && shouldRunConsultation(history, latestUserMessage)) {
    return 0;
  }
  return -1;
}

/** Equipment is only relevant when training at home. */
export function needsHomeEquipmentQuestion(state: ConsultationState): boolean {
  return state.locationSlug === "home" && state.homeEquipment.length === 0;
}

export function getCurrentConsultationTopic(
  state: ConsultationState,
  isProgram: boolean
): ConsultationTopic | null {
  if (!state.goal) return null;
  if (!state.locationSlug) return "location";
  if (needsHomeEquipmentQuestion(state)) return "equipment";
  if (isProgram && !state.movementScreen) return "movement";
  if (isProgram && !state.durationWeeks) return "weeks";
  if (isProgram && !state.sessionsPerWeek) return "sessions";
  if (!state.minutes) return "minutes";
  return null;
}

function applyConsultationAnswer(
  topic: ConsultationTopic,
  text: string,
  state: ConsultationState,
  equipmentLibrary: string[],
  locations: ConsultationLocationOption[]
): void {
  switch (topic) {
    case "location": {
      const slug = parseLocationAnswer(text, locations);
      if (slug) state.locationSlug = slug;
      break;
    }
    case "equipment": {
      const parsed = parseEquipmentFromText(text, equipmentLibrary);
      if (parsed.length > 0) {
        state.homeEquipment = parsed;
      } else {
        const fallback = parseHomeEquipmentAnswer(text, equipmentLibrary);
        if (fallback.length > 0) state.homeEquipment = fallback;
      }
      break;
    }
    case "movement": {
      const screen = parseMovementScreen([text], null);
      if (screen) state.movementScreen = screen;
      break;
    }
    case "weeks": {
      const weeks = parseWeeksAnswer(text);
      if (weeks != null) state.durationWeeks = weeks;
      break;
    }
    case "sessions": {
      const sessions = parseSessionsPerWeekAnswer(text);
      if (sessions != null) state.sessionsPerWeek = sessions;
      break;
    }
    case "minutes": {
      const minutes = parseMinutesAnswer(text);
      if (minutes != null) state.minutes = minutes;
      break;
    }
  }
}

function consultationAckBeforeTopic(
  state: ConsultationState,
  topic: ConsultationTopic,
  locations: ConsultationLocationOption[]
): string | null {
  switch (topic) {
    case "location":
      return "Sounds good.";
    case "equipment": {
      const loc = locations.find((l) => l.slug === state.locationSlug);
      return loc ? `Training at **${loc.name}**.` : null;
    }
    case "movement": {
      if (state.homeEquipment.length > 0) {
        return `Equipment: ${state.homeEquipment.join(", ")}.`;
      }
      const loc = locations.find((l) => l.slug === state.locationSlug);
      return loc ? `Training at **${loc.name}**.` : null;
    }
    case "weeks":
      return "Got it on movement limits.";
    case "sessions":
      return state.durationWeeks != null ? `${state.durationWeeks} weeks — noted.` : null;
    case "minutes":
      return state.sessionsPerWeek != null
        ? `${state.sessionsPerWeek} sessions per week.`
        : null;
    default:
      return null;
  }
}

export function buildConsultationPrompt(
  topic: ConsultationTopic,
  locations: ConsultationLocationOption[],
  equipmentLibrary: string[],
  isProgram: boolean
): ConsultationPrompt {
  switch (topic) {
    case "location":
      return {
        topic,
        question: "Where will you train?",
        options: (locations.length > 0 ? locations : DEFAULT_LOCATIONS).map((loc) => ({
          id: loc.slug,
          label: loc.name,
          value: loc.slug,
        })),
      };
    case "equipment":
      return {
        topic,
        question: "What equipment do you have at home?",
        multiSelect: true,
        options: [
          ...equipmentLibrary.map((title) => ({
            id: title,
            label: title,
            value: title,
          })),
          { id: "bodyweight", label: "Bodyweight only", value: "bodyweight only" },
        ],
      };
    case "movement":
      return {
        topic,
        question: "Any movement limits? (squats, lunges, push-ups, jumping)",
        multiSelect: true,
        options: [
          { id: "all", label: "All good", value: "yes to all" },
          { id: "no-squat", label: "Can't squat", value: "can't squat" },
          { id: "no-lunge", label: "Can't lunge", value: "can't lunge" },
          { id: "no-pushup", label: "Can't do push-ups", value: "can't do push-ups" },
          { id: "no-jump", label: "No jumping", value: "no jumping" },
        ],
      };
    case "weeks":
      return {
        topic,
        question: "How many weeks should the program run?",
        options: [4, 6, 8, 12, 16].map((n) => ({
          id: String(n),
          label: `${n} weeks`,
          value: String(n),
        })),
      };
    case "sessions":
      return {
        topic,
        question: "How many sessions per week?",
        options: [2, 3, 4, 5].map((n) => ({
          id: String(n),
          label: `${n}× per week`,
          value: String(n),
        })),
      };
    case "minutes":
      return {
        topic,
        question: isProgram
          ? "How many minutes per session?"
          : "How long should the workout be (minutes)?",
        options: [15, 20, 25, 30, 45, 60].map((n) => ({
          id: String(n),
          label: `${n} min`,
          value: String(n),
        })),
      };
  }
}

export function buildConsultationResponseText(
  state: ConsultationState,
  topic: ConsultationTopic,
  question: string,
  locations: ConsultationLocationOption[]
): string {
  const ack = consultationAckBeforeTopic(state, topic, locations);
  return ack ? `${ack}\n\n${question}` : question;
}

/** @deprecated Inferring location from goal text skips the location step — use parseLocationAnswer. */
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

function parseExplicitWeeks(texts: string[]): number | undefined {
  for (const m of texts) {
    const match = m.match(/\b(\d{1,2})\s*(-|\s)?weeks?\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 52) return n;
    }
  }
  return undefined;
}

function parseWeeksAnswer(text: string): number | undefined {
  const explicit = parseExplicitWeeks([text]);
  if (explicit != null) return explicit;
  const bare = text.trim().match(/^(\d{1,2})$/);
  if (!bare) return undefined;
  const n = Number.parseInt(bare[1]!, 10);
  if (n > 0 && n <= 52) return n;
  return undefined;
}

function parseExplicitSessionsPerWeek(texts: string[]): number | undefined {
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
    match = m.trim().match(/^(\d{1,2})x$/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 14) return n;
    }
  }
  return undefined;
}

function parseSessionsPerWeekAnswer(text: string): number | undefined {
  const explicit = parseExplicitSessionsPerWeek([text]);
  if (explicit != null) return explicit;
  const bare = text.trim().match(/^(\d{1,2})$/);
  if (!bare) return undefined;
  const n = Number.parseInt(bare[1]!, 10);
  if (n > 0 && n <= 14) return n;
  return undefined;
}

function parseExplicitMinutes(texts: string[]): number | undefined {
  for (const m of texts) {
    const match = m.match(/\b(\d{1,3})\s*(-|\s)?min(?:ute)?s?\b/i);
    if (match) {
      const n = Number.parseInt(match[1]!, 10);
      if (n > 0 && n <= 180) return n;
    }
  }
  return undefined;
}

function parseMinutesAnswer(text: string): number | undefined {
  const explicit = parseExplicitMinutes([text]);
  if (explicit != null) return explicit;
  const bare = text.trim().match(/^(\d{1,3})$/);
  if (!bare) return undefined;
  const n = Number.parseInt(bare[1]!, 10);
  if (n > 0 && n <= 180) return n;
  return undefined;
}

type ConsultationTurn = { role: "user" | "assistant"; text: string };

function consultationTurns(
  history: ChatHistoryMessage[],
  latestUserMessage: string
): ConsultationTurn[] {
  const turns: ConsultationTurn[] = [];
  for (const m of history) {
    if (m.role === "user") {
      turns.push({ role: "user", text: m.parts[0].text.trim() });
    } else if (m.role === "model") {
      turns.push({ role: "assistant", text: m.parts[0].text.trim() });
    }
  }
  if (latestUserMessage.trim()) {
    turns.push({ role: "user", text: latestUserMessage.trim() });
  }
  return turns;
}

/** Pair each consultation answer with the assistant question that preceded it. */
function applyConsultationAnswersFromHistory(
  history: ChatHistoryMessage[],
  latestUserMessage: string,
  state: ConsultationState,
  equipmentLibrary: string[]
): void {
  const turns = consultationTurns(history, latestUserMessage);
  for (let i = 0; i < turns.length - 1; i++) {
    const question = turns[i];
    const answer = turns[i + 1];
    if (question?.role !== "assistant" || answer?.role !== "user") continue;

    if (assistantAskedHomeEquipment(question.text)) {
      const equipment = parseHomeEquipmentAnswer(answer.text, equipmentLibrary);
      if (equipment.length > 0) state.homeEquipment = equipment;
    }
    if (!state.movementScreen && assistantAskedMovementScreen(question.text)) {
      const screen = parseMovementScreen([answer.text], question.text);
      if (screen) state.movementScreen = screen;
    }
    if (state.durationWeeks == null && assistantAskedDurationWeeks(question.text)) {
      const weeks = parseWeeksAnswer(answer.text);
      if (weeks != null) state.durationWeeks = weeks;
    }
    if (state.sessionsPerWeek == null && assistantAskedSessionsPerWeek(question.text)) {
      const sessions = parseSessionsPerWeekAnswer(answer.text);
      if (sessions != null) state.sessionsPerWeek = sessions;
    }
    if (state.minutes == null && assistantAskedMinutes(question.text)) {
      const minutes = parseMinutesAnswer(answer.text);
      if (minutes != null) state.minutes = minutes;
    }
  }
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

function assistantAskedDurationWeeks(lastAssistant: string | null): boolean {
  if (!lastAssistant) return false;
  return /\bhow many\b[\s\S]{0,60}\bweeks?\b/i.test(lastAssistant);
}

function assistantAskedSessionsPerWeek(lastAssistant: string | null): boolean {
  if (!lastAssistant) return false;
  return /\bhow many\b[\s\S]{0,60}\bsessions?\s*per\s*week\b/i.test(lastAssistant);
}

function assistantAskedMinutes(lastAssistant: string | null): boolean {
  if (!lastAssistant) return false;
  return (
    /\bhow (?:long|many)\b[\s\S]{0,80}\bminutes?\b/i.test(lastAssistant) ||
    /\bsession\b[\s\S]{0,50}\bminutes?\b/i.test(lastAssistant) ||
    /\bin\s*\*?\*?minutes?\*?\*?\b/i.test(lastAssistant)
  );
}

function assistantAskedHomeEquipment(text: string): boolean {
  return (
    /\bwhat\b[\s\S]{0,100}\bequipment\b/i.test(text) &&
    /\b(home|at home)\b/i.test(text)
  );
}

function resolveEquipmentLabel(label: string, equipmentLibrary: string[]): string {
  const libMatch = equipmentLibrary.find((e) => e.toLowerCase() === label.toLowerCase());
  return libMatch ?? label;
}

function parseEquipmentFromText(text: string, equipmentLibrary: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  if (
    /\b(body\s*weight|bodyweight)(\s+only)?\b/.test(lower) ||
    /\b(no equipment|nothing|none)\b/.test(lower)
  ) {
    found.add("Bodyweight only");
  }

  for (const title of equipmentLibrary) {
    const t = title.toLowerCase();
    if (lower.includes(t)) found.add(title);
  }

  const aliases: [RegExp, string][] = [
    [/\bresistance bands?\b/, "Resistance bands"],
    [/\b(miniband|mini band|mini-band)\b/, "Resistance bands"],
    [/\bdumbbells?\b/, "Dumbbells"],
    [/\b(barbells?|barebells?)\b/, "Barbell"],
    [/\bankle weights?\b/, "Ankle weights"],
    [/\bkettlebells?\b/, "Kettlebell"],
    [/\b(kb|kbs)\b/, "Kettlebell"],
    [/\b(yoga )?mat\b/, "Yoga mat"],
    [/\bfoam roller\b/, "Foam roller"],
    [/\bmedicine balls?\b/, "Medicine ball"],
    [/\b(cable|pulley)\b/, "Cable machine"],
  ];

  for (const [re, label] of aliases) {
    if (re.test(lower)) {
      found.add(resolveEquipmentLabel(label, equipmentLibrary));
    }
  }

  return [...found];
}

/** Parse a single reply to the home-equipment question (typos + freeform fallback). */
function parseHomeEquipmentAnswer(answer: string, equipmentLibrary: string[]): string[] {
  const parsed = parseEquipmentFromText(answer, equipmentLibrary);
  if (parsed.length > 0) return parsed;

  const trimmed = answer.trim();
  if (trimmed.length < 2 || trimmed.length > 160) return [];
  if (/^\d+$/.test(trimmed)) return [];
  if (coachShouldCreateNew(trimmed) || trimmed.includes("?")) return [];

  const parts = trimmed
    .split(/[,;]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);
  if (parts.length > 1) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  }
  return [trimmed.charAt(0).toUpperCase() + trimmed.slice(1)];
}

function parseContextBareNumber(
  texts: string[],
  lastAssistant: string | null,
  asked: (last: string | null) => boolean,
  min: number,
  max: number
): number | undefined {
  if (!asked(lastAssistant)) return undefined;
  const latest = texts[texts.length - 1]?.trim() ?? "";
  const match = latest.match(/^(\d{1,3})$/);
  if (!match) return undefined;
  const n = Number.parseInt(match[1]!, 10);
  if (n >= min && n <= max) return n;
  return undefined;
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
  const found = new Set<string>();
  for (const text of texts) {
    for (const item of parseEquipmentFromText(text, equipmentLibrary)) {
      found.add(item);
    }
  }
  return [...found];
}

export function buildConsultationState(
  history: ChatHistoryMessage[],
  latestUserMessage: string,
  equipmentLibrary: string[],
  locations: ConsultationLocationOption[] = DEFAULT_LOCATIONS
): ConsultationState {
  const userTexts = allUserTexts(history, latestUserMessage);
  const state: ConsultationState = { homeEquipment: [] };
  const startIdx = findConsultationStartIndex(userTexts, history, latestUserMessage);

  if (startIdx < 0) {
    state.goal = parseGoal(userTexts);
    return state;
  }

  const consultationTexts = userTexts.slice(startIdx);
  state.goal = consultationTexts[0]!;

  for (let i = 1; i < consultationTexts.length; i++) {
    const isProgram = coachWantsProgram(userTexts.slice(0, startIdx + i + 1));
    const topic = getCurrentConsultationTopic(state, isProgram);
    if (!topic) break;
    applyConsultationAnswer(topic, consultationTexts[i]!, state, equipmentLibrary, locations);
  }

  return state;
}

export function formatEquipmentQuestionExamples(equipmentLibrary: string[]): string {
  const picks = equipmentLibrary.slice(0, 8);
  const examples = [...picks, "bodyweight only"].join(", ");
  return examples;
}

export function nextConsultationQuestion(
  state: ConsultationState,
  isProgram: boolean,
  equipmentLibrary: string[],
  locations: ConsultationLocationOption[] = DEFAULT_LOCATIONS
): string | null {
  const topic = getCurrentConsultationTopic(state, isProgram);
  if (!topic) return null;
  return buildConsultationPrompt(topic, locations, equipmentLibrary, isProgram).question;
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
  _equipmentLibrary: string[] = []
): boolean {
  if (!state.goal) return false;
  return getCurrentConsultationTopic(state, isProgram) === null;
}

export function missingConsultationTopics(
  state: ConsultationState,
  isProgram: boolean,
  _equipmentLibrary: string[] = []
): string[] {
  const missing: string[] = [];
  if (!state.goal) missing.push("the main focus or goal for this plan");
  if (!state.locationSlug) missing.push("where they'll train (home, gym, or at the court)");
  if (needsHomeEquipmentQuestion(state)) {
    missing.push("what equipment they have at home (or bodyweight only)");
  }
  if (isProgram) {
    if (!state.movementScreen) {
      missing.push(
        "movement screen — can they squat, lunge, do push-ups, and jump (or any limits)"
      );
    }
    if (!state.durationWeeks) missing.push("how many weeks the program should run");
    if (!state.sessionsPerWeek) missing.push("how many sessions per week");
    if (!state.minutes) missing.push("how long each session should be (minutes)");
  } else if (!state.minutes) {
    missing.push("how long the workout should be (minutes)");
  }
  return missing;
}

function formatKnownConsultationLines(state: ConsultationState, isProgram: boolean): string[] {
  const known: string[] = [];
  if (state.goal) known.push(`Focus: ${state.goal}`);
  if (state.locationSlug) {
    const label =
      state.locationSlug === "home"
        ? "Home"
        : state.locationSlug === "gym"
          ? "Gym"
          : "At the court";
    known.push(`Training location: ${label}`);
  }
  if (state.locationSlug === "home" && state.homeEquipment.length > 0) {
    known.push(`Home equipment: ${state.homeEquipment.join(", ")}`);
  }
  if (isProgram && state.movementScreen) {
    const blocked: string[] = [];
    if (!state.movementScreen.squat) blocked.push("squats");
    if (!state.movementScreen.lunge) blocked.push("lunges");
    if (!state.movementScreen.pushUp) blocked.push("push-ups");
    if (!state.movementScreen.jump) blocked.push("jumping");
    known.push(
      blocked.length > 0
        ? `Movement limits: avoid ${blocked.join(", ")}`
        : "Movement screen: cleared for squat, lunge, push-up, jump"
    );
  }
  if (state.durationWeeks) known.push(`Duration: ${state.durationWeeks} weeks`);
  if (state.sessionsPerWeek) known.push(`Frequency: ${state.sessionsPerWeek} sessions/week`);
  if (state.minutes) known.push(`Session length: ~${state.minutes} minutes`);
  return known;
}

/** Guides Gemini to run a natural consultation; becomes the generation brief when complete. */
export function formatConsultationGuide(
  state: ConsultationState,
  isProgram: boolean,
  equipmentLibrary: string[]
): string {
  const missing = missingConsultationTopics(state, isProgram, equipmentLibrary);
  if (missing.length === 0) {
    return formatConsultationBrief(state, isProgram);
  }

  const known = formatKnownConsultationLines(state, isProgram);
  const nextTopic = missing[0]!;
  const lines = [
    "<consultation_state internal_only=\"true\">",
    "PRIVATE server context — never repeat, quote, summarize, or label this block in your reply.",
    'Never say "consultation guide", "still need", "already clear", or bullet planning lists to the admin.',
    "Reply in 1–2 short sentences total, then ONE question about ask_next_about. Phrase the question in fresh words each time.",
    "No filler praise. Do not restate their whole request. Sound like a padel S&C coach in a quick chat, not customer support.",
    "",
    `known: ${known.length > 0 ? known.join(" | ") : "none yet"}`,
    `ask_next_about: ${nextTopic}`,
  ];

  if (missing.length > 1) {
    lines.push(`ask_later_not_now: ${missing.slice(1).join("; ")}`);
  }
  if (
    needsHomeEquipmentQuestion(state) &&
    nextTopic.includes("equipment")
  ) {
    lines.push(
      `equipment_hints: ${formatEquipmentQuestionExamples(equipmentLibrary)}`
    );
  }
  lines.push("</consultation_state>");
  return lines.join("\n");
}

export function shouldRunConsultation(
  history: ChatHistoryMessage[],
  userMessage: string
): boolean {
  if (coachShouldRecommendCatalogOnly(userMessage)) return false;

  const userTexts = allUserTexts(history, userMessage);
  const isProgram = coachWantsProgram(userTexts);
  const state = buildConsultationState(history, userMessage, []);
  const next = nextConsultationQuestion(state, isProgram, []);

  if (next === null) return false;

  const hadCreateIntent = userTexts.some((t) => coachShouldCreateNew(t));
  const lastAssistant = lastAssistantText(history);
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
  } else if (state.locationSlug === "gym") {
    lines.push(
      "- Training at gym: use standard gym equipment from the catalog tagged for this location."
    );
  } else if (state.locationSlug === "at-the-court") {
    lines.push(
      "- Training at the court: prefer court-appropriate exercises; minimal or portable equipment only."
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
  if (needsHomeEquipmentQuestion(state)) {
    lines.push("- WARNING: Home equipment not confirmed — do not generate until equipment is known.");
  }
  lines.push(
    "- Set generate_program location_slug to the training location above when building programs."
  );
  if (isConsultationComplete(state, isProgram, [])) {
    lines.push(
      "",
      "## CONSULTATION COMPLETE",
      `You MUST call ${isProgram ? "generate_program" : "generate_workout"} now.`,
      "Do not ask more consultation questions. Do not describe the program in prose only — return the tool call so the admin can review and save it.",
      isProgram
        ? "- generate_program sessions[]: return ONLY sessions_per_week templates (one training week). On save, week_sizes and program_weeks match the manual program builder (Day 1, Day 2, … per week)."
        : "- generate_workout: one session filling the target minutes with warmup, main, and cooldown."
    );
  }
  return lines.join("\n");
}

export function formatGenerationCoachBrief(
  state: ConsultationState,
  isProgram: boolean,
  toolName: "generate_program" | "generate_workout"
): string {
  const base = formatConsultationBrief(state, isProgram);
  return `${base}

## GENERATION — call ${toolName} now
- Use consultation values above for duration, frequency, location_slug, equipment, and movement limits.
- Copy exercise_id UUIDs exactly from the catalog (square brackets). Do not invent IDs.
- Every exercise needs phase (warmup, main, or cooldown) and rest_after_seconds.
${
  isProgram
    ? `- sessions[] must contain exactly ${state.sessionsPerWeek ?? "sessions_per_week"} template session(s) for ONE week — not every week in the block.`
    : `- Target ~${state.minutes ?? 30} minutes for this single workout.`
}
- Include at least one rotational or anti-rotational exercise in the main block.`;
}

export function isValidLocationSlug(
  slug: string | undefined
): slug is NonNullable<ConsultationState["locationSlug"]> {
  return slug != null && (LOCATION_SLUGS as readonly string[]).includes(slug);
}

/** Strip leaked internal consultation planning from model replies. */
export function sanitizeCoachChatReply(text: string): string {
  const lines = text.split("\n");
  const filtered: string[] = [];
  let skippingGuideBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^consultation guide:?$/i.test(trimmed)) {
      skippingGuideBlock = true;
      continue;
    }

    if (skippingGuideBlock) {
      const isPlanningLine =
        /^\*?\s*still need:?$/i.test(trimmed) ||
        /^\*?\s*(focus|training location):/i.test(trimmed) ||
        (/^[\*\-•]\s/.test(trimmed) &&
          /equipment|movement|squat|lunge|push|jump|weeks?|sessions?|minutes?|limits/i.test(
            trimmed
          ));

      if (isPlanningLine || trimmed.length === 0) {
        continue;
      }
      skippingGuideBlock = false;
    }

    if (/^<consultation_state/i.test(trimmed) || /^<\/consultation_state>/i.test(trimmed)) {
      continue;
    }
    if (/^(known|ask_next_about|ask_later_not_now|equipment_hints):/i.test(trimmed)) {
      continue;
    }

    filtered.push(line);
  }

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
