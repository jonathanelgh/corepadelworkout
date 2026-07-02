"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import type { ProgramCatalogRow } from "@/lib/programs/programs-catalog";
import type { ChatHistoryMessage, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { ConsultationPrompt } from "@/lib/programs/coach-consultation";
import {
  groupExercisesByPhase,
  SESSION_PHASE_LABELS,
} from "@/lib/programs/session-phase";
import {
  loadMemberCoachData,
  saveMemberCoachWorkout,
  sendMemberCoachMessage,
} from "@/app/member/member-coach-actions";
import { CoachChatMarkdown } from "@/components/programs/coach-chat-markdown";

const SUGGESTED_PROMPTS = [
  "How am I doing in my current program?",
  "My shoulders feel tight after matches — what should I do?",
  "Build me a 30-minute home activation before padel.",
  "Which program should I follow for more power?",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  consultationPrompt?: ConsultationPrompt;
  recommendedPrograms?: {
    introText: string;
    programs: ProgramCatalogRow[];
  };
  workoutProposal?: WorkoutProposal;
  proposalSaved?: boolean;
  savedPlayHref?: string;
};

function ConsultationOptions({
  prompt,
  pending,
  multiDraft,
  onToggleMulti,
  onConfirmMulti,
  onSelectSingle,
}: {
  prompt: ConsultationPrompt;
  pending: boolean;
  multiDraft: string[];
  onToggleMulti: (value: string) => void;
  onConfirmMulti: (values: string[]) => void;
  onSelectSingle: (value: string) => void;
}) {
  if (prompt.multiSelect) {
    return (
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {prompt.options.map((opt) => {
            const selected = multiDraft.includes(opt.value);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={pending}
                onClick={() => onToggleMulti(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                  selected
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={pending || multiDraft.length === 0}
          onClick={() => onConfirmMulti(multiDraft)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {prompt.options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={pending}
          onClick={() => onSelectSingle(opt.value)}
          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function formatProposalExerciseMeta(ex: WorkoutProposalExercise): string {
  return [
    ex.sets != null && ex.reps != null && `${ex.sets}×${ex.reps}`,
    ex.duration_minutes != null && `${ex.duration_minutes} min`,
    ex.rest_between_sets_seconds != null && ex.rest_between_sets_seconds > 0
      ? `${ex.rest_between_sets_seconds}s between sets`
      : null,
    ex.rest_after_seconds > 0 ? `${ex.rest_after_seconds}s rest` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function renderPhasedExerciseList(exercises: WorkoutProposalExercise[]) {
  const phased = groupExercisesByPhase(
    exercises.map((ex) => ({ ...ex, sessionPhase: ex.phase }))
  );
  const rendered = new Set<string>();

  return (
    <div className="space-y-3">
      {phased.map(({ phase, items }) => (
        <div key={phase}>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            {SESSION_PHASE_LABELS[phase]}
          </p>
          <ul className="mt-1.5 space-y-1">
            {items.map((ex) => {
              if (ex.choice_group) {
                if (rendered.has(ex.choice_group)) return null;
                rendered.add(ex.choice_group);
                const options = items.filter((o) => o.choice_group === ex.choice_group);
                return (
                  <li key={ex.choice_group} className="text-sm text-zinc-700">
                    <span className="text-zinc-500">Pick one: </span>
                    {options.map((opt, i) => (
                      <span key={opt.exercise_id}>
                        {i > 0 ? " · " : ""}
                        <span className="font-medium">{opt.title}</span>
                      </span>
                    ))}
                  </li>
                );
              }
              return (
                <li key={ex.exercise_id} className="text-sm text-zinc-700">
                  <span className="font-medium">{ex.title}</span>
                  <span className="text-zinc-500"> — {formatProposalExerciseMeta(ex)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function toGeminiHistory(messages: ChatMessage[]): ChatHistoryMessage[] {
  const out: ChatHistoryMessage[] = [];
  for (const m of messages) {
    if (m.role === "user" && m.text) {
      out.push({ role: "user", parts: [{ text: m.text }] });
    } else if (m.role === "assistant") {
      if (m.text) {
        out.push({ role: "model", parts: [{ text: m.text }] });
      } else if (m.recommendedPrograms) {
        const titles = m.recommendedPrograms.programs.map((p) => p.title).join(", ");
        out.push({
          role: "model",
          parts: [{ text: `${m.recommendedPrograms.introText}\nRecommended: ${titles}` }],
        });
      } else if (m.workoutProposal) {
        out.push({
          role: "model",
          parts: [
            {
              text: `Proposed workout: ${m.workoutProposal.title}\n${m.workoutProposal.description}`,
            },
          ],
        });
      }
    }
  }
  return out;
}

export function MemberCoachClient({ hasActivePro }: { hasActivePro: boolean }) {
  const [catalog, setCatalog] = useState<ProgramCatalogRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(hasActivePro);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I'm your Core Padel coach. Ask me about training, recovery, or your programs — or I can build you a custom workout.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [savingProposalId, setSavingProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasActivePro) return;
    void loadMemberCoachData().then((res) => {
      setCatalogLoading(false);
      if ("ok" in res && res.ok) setCatalog(res.data.programsCatalog);
      else if ("error" in res) setError(res.error);
    });
  }, [hasActivePro]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending, scrollToBottom]);

  const lastAssistant = messages[messages.length - 1];
  const activeConsultationPrompt =
    lastAssistant?.role === "assistant" && lastAssistant.consultationPrompt && !pending
      ? lastAssistant.consultationPrompt
      : null;

  useEffect(() => {
    if (activeConsultationPrompt?.multiSelect) setMultiDraft([]);
  }, [activeConsultationPrompt?.topic, messages.length]);

  function toggleMultiDraft(value: string) {
    if (value === "yes to all") {
      setMultiDraft(["yes to all"]);
      return;
    }
    setMultiDraft((prev) => {
      const withoutAll = prev.filter((v) => v !== "yes to all");
      return withoutAll.includes(value)
        ? withoutAll.filter((v) => v !== value)
        : [...withoutAll, value];
    });
  }

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || pending || !hasActivePro) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setPending(true);

    const res = await sendMemberCoachMessage({
      history: toGeminiHistory(messages),
      userMessage: text,
      programsCatalog: catalog,
    });
    setPending(false);

    if ("error" in res) {
      setError(res.error);
      return;
    }

    const assistantId = `a-${Date.now()}`;
    if (res.type === "consultation") {
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: res.text, consultationPrompt: res.prompt },
      ]);
    } else if (res.type === "text") {
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: res.text }]);
    } else if (res.type === "recommend_programs") {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          recommendedPrograms: { introText: res.introText, programs: res.programs },
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", workoutProposal: res.proposal },
      ]);
    }
  }

  async function handleSaveWorkout(proposalMsgId: string, proposal: WorkoutProposal) {
    setSavingProposalId(proposalMsgId);
    setError(null);
    const res = await saveMemberCoachWorkout(proposal);
    setSavingProposalId(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === proposalMsgId
          ? { ...m, proposalSaved: true, savedPlayHref: res.playHref, text: `Saved **${res.title}**. Tap Start workout when you're ready.` }
          : m
      )
    );
  }

  if (!hasActivePro) {
    return null;
  }

  return (
    <div className="mx-auto flex h-[min(72vh,720px)] max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">AI Coach</h2>
          <p className="text-xs text-zinc-500">Padel fitness · your programs · custom workouts</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {catalogLoading && (
          <p className="mb-3 text-center text-xs text-zinc-400">Loading coach…</p>
        )}
        <div className="space-y-3">
          {messages.map((m, index) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-100 bg-zinc-50 text-zinc-700"
                }`}
              >
                {m.text && (
                  <div>{m.role === "assistant" ? <CoachChatMarkdown text={m.text} /> : m.text}</div>
                )}

                {m.consultationPrompt && index === messages.length - 1 && m.role === "assistant" && (
                  <ConsultationOptions
                    prompt={m.consultationPrompt}
                    pending={pending}
                    multiDraft={multiDraft}
                    onToggleMulti={toggleMultiDraft}
                    onConfirmMulti={(values) => {
                      const payload =
                        values.includes("yes to all") || values.length === 0
                          ? "yes to all"
                          : values.join(", ");
                      void handleSend(payload);
                    }}
                    onSelectSingle={(value) => void handleSend(value)}
                  />
                )}

                {m.recommendedPrograms && (
                  <div className="space-y-3">
                    <CoachChatMarkdown text={m.recommendedPrograms.introText} />
                    <div className="grid gap-2">
                      {m.recommendedPrograms.programs.map((p) => (
                        <Link
                          key={p.id}
                          href={`/programs/${p.slug}`}
                          className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-emerald-200"
                        >
                          {p.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.cover_image_url}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
                              —
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900">{p.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{p.summary}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {m.workoutProposal && !m.proposalSaved && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-zinc-900">{m.workoutProposal.title}</p>
                      <p className="mt-1 text-zinc-600">{m.workoutProposal.description}</p>
                    </div>
                    {renderPhasedExerciseList(m.workoutProposal.exercises)}
                    <button
                      type="button"
                      disabled={savingProposalId === m.id}
                      onClick={() => void handleSaveWorkout(m.id, m.workoutProposal!)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {savingProposalId === m.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Save & start workout
                        </>
                      )}
                    </button>
                  </div>
                )}

                {m.proposalSaved && m.savedPlayHref && (
                  <Link
                    href={m.savedPlayHref}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Start workout
                  </Link>
                )}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500">
                <Loader2 className="inline h-4 w-4 animate-spin" />
                <span className="ml-2">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length <= 2 && !pending && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-4 py-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void handleSend(prompt)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 hover:border-zinc-300"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      )}

      <form
        className="flex gap-2 border-t border-zinc-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach anything…"
          disabled={pending || catalogLoading}
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !input.trim() || catalogLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
