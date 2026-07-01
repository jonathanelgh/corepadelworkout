"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
  CheckCircle2,
  Pencil,
  SlidersHorizontal,
} from "lucide-react";
import type { ProgramCatalogRow } from "@/lib/programs/programs-catalog";
import type { MemberPickerOption } from "@/lib/programs/profile-ai-context";
import type { ChatHistoryMessage, ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { ConsultationPrompt } from "@/lib/programs/coach-consultation";
import {
  groupExercisesByPhase,
  SESSION_PHASE_LABELS,
} from "@/lib/programs/session-phase";
import {
  getProgramCoverUrl,
  saveAiCoachProgram,
  saveAiCoachWorkout,
  sendAiCoachMessage,
} from "../ai-coach-actions";

const SUGGESTED_PROMPTS = [
  "Recommend programs for intermediate players who want better court movement.",
  "Build a home strength program for padel.",
  "What published programs focus on shoulder durability?",
  "Create a pre-match activation workout.",
];

type GeneratedWorkout = {
  programId: string;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published";
  coverPending?: boolean;
  coverImageUrl?: string;
};

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
  programProposal?: ProgramProposal;
  proposalSaved?: boolean;
  generatedWorkout?: GeneratedWorkout;
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
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white"
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
          className="rounded-lg bg-[#ccff00] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-50"
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
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function simpleMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) => {
      if (chunk.startsWith("**") && chunk.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold text-gray-900">
            {chunk.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{chunk}</span>;
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
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
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            {SESSION_PHASE_LABELS[phase]}
          </p>
          <ul className="mt-1.5 space-y-1">
            {items.map((ex) => {
              if (ex.choice_group) {
                if (rendered.has(ex.choice_group)) return null;
                rendered.add(ex.choice_group);
                const options = items.filter((o) => o.choice_group === ex.choice_group);
                return (
                  <li key={ex.choice_group} className="text-sm text-gray-700">
                    <span className="text-gray-500">Pick one: </span>
                    {options.map((opt, i) => (
                      <span key={opt.exercise_id}>
                        {i > 0 ? " · " : ""}
                        <span className="font-medium">{opt.title}</span>
                        <span className="text-gray-500"> ({formatProposalExerciseMeta(opt)})</span>
                      </span>
                    ))}
                  </li>
                );
              }
              return (
                <li key={ex.exercise_id} className="text-sm text-gray-700">
                  <span className="font-medium">{ex.title}</span>
                  <span className="text-gray-500"> — {formatProposalExerciseMeta(ex)}</span>
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
              text: `Proposed workout: ${m.workoutProposal.title}\n${m.workoutProposal.description}\nExercises: ${m.workoutProposal.exercises.map((e) => e.title).join(", ")}`,
            },
          ],
        });
      } else if (m.programProposal) {
        out.push({
          role: "model",
          parts: [
            {
              text: `Proposed program: ${m.programProposal.title}\n${m.programProposal.description}\n${m.programProposal.duration_weeks} weeks × ${m.programProposal.sessions_per_week}/week, ${m.programProposal.sessions.length} session(s) drafted`,
            },
          ],
        });
      } else if (m.generatedWorkout) {
        out.push({
          role: "model",
          parts: [{ text: `Created program: ${m.generatedWorkout.title}` }],
        });
      }
    }
  }
  return out;
}

export function AiCoachClient({
  initialCatalog,
  members,
}: {
  initialCatalog: ProgramCatalogRow[];
  members: MemberPickerOption[];
}) {
  const [catalog] = useState(initialCatalog);
  const [targetUserId, setTargetUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I can **recommend programs** from your catalog or **build a custom** workout or program from your exercises.\n\nWhat do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [savingProposalId, setSavingProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    if (activeConsultationPrompt?.multiSelect) {
      setMultiDraft([]);
    }
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

  function confirmMultiDraft(values: string[]) {
    const payload =
      values.includes("yes to all") || values.length === 0 ? "yes to all" : values.join(", ");
    void handleSend(payload);
  }

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || pending) return;

    setError(null);
    setInput("");
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);

    const history = toGeminiHistory(messages);
    const res = await sendAiCoachMessage({
      history,
      userMessage: text,
      programsCatalog: catalog,
      targetUserId: targetUserId || null,
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
        {
          id: assistantId,
          role: "assistant",
          text: res.text,
          consultationPrompt: res.prompt,
        },
      ]);
    } else if (res.type === "text") {
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: res.text },
      ]);
    } else if (res.type === "recommend_programs") {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          recommendedPrograms: {
            introText: res.introText,
            programs: res.programs,
          },
        },
      ]);
    } else if (res.type === "workout_proposal") {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          workoutProposal: res.proposal,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          programProposal: res.proposal,
        },
      ]);
    }
  }

  async function handleSaveProgram(
    proposalMsgId: string,
    proposal: ProgramProposal,
    publish: boolean
  ) {
    setSavingProposalId(proposalMsgId);
    setError(null);

    const res = await saveAiCoachProgram(proposal, { publish, generateCover: true });
    setSavingProposalId(null);

    if ("error" in res) {
      setError(res.error);
      return;
    }

    setMessages((prev) =>
      prev
        .map((m) =>
          m.id === proposalMsgId
            ? { ...m, proposalSaved: true, programProposal: undefined }
            : m
        )
        .concat({
          id: `saved-${Date.now()}`,
          role: "assistant",
          generatedWorkout: {
            programId: res.programId,
            slug: res.slug,
            title: res.title,
            description: `${res.description} (${res.sessionCount} sessions)`,
            status: res.status,
            coverPending: res.coverPending,
          },
        })
    );

    if (res.coverPending) {
      void pollCover(res.programId);
    }
  }

  async function handleSaveWorkout(
    proposalMsgId: string,
    proposal: WorkoutProposal,
    publish: boolean
  ) {
    setSavingProposalId(proposalMsgId);
    setError(null);

    const res = await saveAiCoachWorkout(proposal, { publish, generateCover: true });
    setSavingProposalId(null);

    if ("error" in res) {
      setError(res.error);
      return;
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === proposalMsgId
          ? { ...m, proposalSaved: true, workoutProposal: undefined }
          : m
      ).concat({
        id: `saved-${Date.now()}`,
        role: "assistant",
        generatedWorkout: {
          programId: res.programId,
          slug: res.slug,
          title: res.title,
          description: res.description,
          status: res.status,
          coverPending: res.coverPending,
        },
      })
    );

    if (res.coverPending) {
      void pollCover(res.programId);
    }
  }

  async function pollCover(programId: string, attempt = 0) {
    if (attempt > 12) return;
    await new Promise((r) => setTimeout(r, 4000));
    const res = await getProgramCoverUrl(programId);
    if ("error" in res) return;
    if (res.imageUrl) {
      setMessages((prev) =>
        prev.map((m) =>
          m.generatedWorkout?.programId === programId
            ? {
                ...m,
                generatedWorkout: {
                  ...m.generatedWorkout,
                  coverImageUrl: res.imageUrl!,
                  coverPending: false,
                },
              }
            : m
        )
      );
      return;
    }
    void pollCover(programId, attempt + 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Programs
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-[#9dcc00]" />
            AI Coach
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 whitespace-nowrap">Personalize for</span>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="max-w-[200px] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">No member (generic)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                  {m.email ? ` (${m.email})` : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="hidden text-xs text-gray-500 sm:block">
            {catalog.length} published program{catalog.length === 1 ? "" : "s"} in catalog
          </p>
          <Link
            href="/admin/programs/ai/prompts"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Edit prompts
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((m, index) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-black text-white"
                    : "border border-gray-200 bg-white text-gray-700 shadow-sm"
                }`}
              >
                {m.text && (
                  <div className={m.role === "user" ? "text-white" : ""}>
                    {m.role === "assistant" ? simpleMarkdown(m.text) : m.text}
                  </div>
                )}

                {m.consultationPrompt &&
                  index === messages.length - 1 &&
                  m.role === "assistant" && (
                    <ConsultationOptions
                      prompt={m.consultationPrompt}
                      pending={pending}
                      multiDraft={multiDraft}
                      onToggleMulti={toggleMultiDraft}
                      onConfirmMulti={confirmMultiDraft}
                      onSelectSingle={(value) => void handleSend(value)}
                    />
                  )}

                {m.recommendedPrograms && (
                  <div className="space-y-3">
                    <div>{simpleMarkdown(m.recommendedPrograms.introText)}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {m.recommendedPrograms.programs.map((p) => (
                        <Link
                          key={p.id}
                          href={`/admin/programs/${p.id}/edit`}
                          className="group flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-gray-300 hover:bg-white"
                        >
                          {p.cover_image_url ? (
                            <img
                              src={p.cover_image_url}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
                              No img
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 group-hover:underline">
                              {p.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{p.summary}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {[p.weeks != null && `${p.weeks} wk`, p.minutes != null && `${p.minutes} min`, p.difficulty]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {m.programProposal && !m.proposalSaved && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {m.programProposal.title}
                      </p>
                      <p className="mt-1 text-gray-600">{m.programProposal.description}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {m.programProposal.duration_weeks} week
                        {m.programProposal.duration_weeks === 1 ? "" : "s"} ·{" "}
                        {m.programProposal.sessions_per_week} session
                        {m.programProposal.sessions_per_week === 1 ? "" : "s"}/week ·{" "}
                        {m.programProposal.sessions.length} session
                        {m.programProposal.sessions.length === 1 ? "" : "s"} in draft
                        {m.programProposal.sessions.length <
                        m.programProposal.duration_weeks * m.programProposal.sessions_per_week
                          ? " (weekly template will repeat on save if needed)"
                          : ""}
                      </p>
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
                      {m.programProposal.sessions.map((sess, si) => (
                        <details key={si} className="group rounded-md bg-white px-3 py-2">
                          <summary className="cursor-pointer text-sm font-medium text-gray-900">
                            {sess.name}
                            <span className="ml-2 font-normal text-gray-500">
                              ({sess.exercises.length} exercises)
                            </span>
                          </summary>
                          <div className="mt-2">{renderPhasedExerciseList(sess.exercises)}</div>
                        </details>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingProposalId === m.id}
                        onClick={() => void handleSaveProgram(m.id, m.programProposal!, true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                      >
                        {savingProposalId === m.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Publish program
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={savingProposalId === m.id}
                        onClick={() => void handleSaveProgram(m.id, m.programProposal!, false)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                      >
                        Save as draft
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Saves all sessions with correct week/frequency metadata. Uses only published
                      exercises from your library.
                    </p>
                  </div>
                )}

                {m.workoutProposal && !m.proposalSaved && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {m.workoutProposal.title}
                      </p>
                      <p className="mt-1 text-gray-600">{m.workoutProposal.description}</p>
                    </div>
                    {renderPhasedExerciseList(m.workoutProposal.exercises)}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingProposalId === m.id}
                        onClick={() => void handleSaveWorkout(m.id, m.workoutProposal!, true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                      >
                        {savingProposalId === m.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Publish program
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={savingProposalId === m.id}
                        onClick={() => void handleSaveWorkout(m.id, m.workoutProposal!, false)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                      >
                        Save as draft
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Uses only published exercises from your library. Publish makes the program
                      visible at /programs; draft stays admin-only until you publish from the editor.
                    </p>
                  </div>
                )}

                {m.generatedWorkout && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-emerald-700">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Program created: {m.generatedWorkout.title}
                        </p>
                        <p className="mt-1 text-gray-600">{m.generatedWorkout.description}</p>
                        {m.generatedWorkout.status === "draft" ? (
                          <p className="mt-2 text-sm text-amber-800">
                            Saved as draft — members cannot open this URL until you publish it.
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-emerald-800">
                            Published — members can enroll and start workouts.
                          </p>
                        )}
                      </div>
                    </div>
                    {m.generatedWorkout.coverImageUrl ? (
                      <img
                        src={m.generatedWorkout.coverImageUrl}
                        alt=""
                        className="h-32 w-full rounded-xl object-cover"
                      />
                    ) : m.generatedWorkout.coverPending ? (
                      <p className="text-xs text-gray-500">Generating cover image…</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/programs/${m.generatedWorkout.programId}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit program
                      </Link>
                      {m.generatedWorkout.status === "published" && (
                        <Link
                          href={`/programs/${m.generatedWorkout.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View program
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Coach is thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={pending}
                  onClick={() => void handleSend(p)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs text-gray-600 hover:border-gray-300 hover:bg-white disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={pending}
              placeholder="Ask for program recommendations or a custom workout…"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-black px-4 py-3 text-white hover:bg-gray-800 disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
