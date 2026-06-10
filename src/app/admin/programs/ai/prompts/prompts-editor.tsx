"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RotateCcw, Save } from "lucide-react";
import {
  AI_PROMPT_PLACEHOLDERS,
  type AiPromptKey,
  type AiPromptRecord,
} from "@/lib/programs/ai-prompts";
import { resetAiPrompt, saveAiPrompt } from "../prompt-actions";

export function AiPromptsEditor({ initialPrompts }: { initialPrompts: AiPromptRecord[] }) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [activeKey, setActiveKey] = useState<AiPromptKey>(initialPrompts[0]?.key ?? "ai_coach_system");
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialPrompts.map((p) => [p.key, p.body]))
  );
  const [pending, setPending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const active = prompts.find((p) => p.key === activeKey) ?? prompts[0]!;
  const draft = drafts[activeKey] ?? active.body;
  const isDirty = draft !== active.body;

  function setDraft(body: string) {
    setDrafts((prev) => ({ ...prev, [activeKey]: body }));
    setMessage(null);
  }

  async function handleSave() {
    setPending(true);
    setMessage(null);
    const res = await saveAiPrompt({ key: activeKey, body: draft });
    setPending(false);
    if ("error" in res) {
      setMessage({ type: "err", text: res.error });
      return;
    }
    setPrompts((prev) =>
      prev.map((p) => (p.key === activeKey ? { ...p, body: draft } : p))
    );
    setMessage({ type: "ok", text: "Prompt saved." });
  }

  async function handleReset() {
    if (!confirm("Reset this prompt to the default template? Your edits will be lost.")) return;
    setResetting(true);
    setMessage(null);
    const res = await resetAiPrompt(activeKey);
    setResetting(false);
    if ("error" in res) {
      setMessage({ type: "err", text: res.error });
      return;
    }
    setDrafts((prev) => ({ ...prev, [activeKey]: res.body }));
    setPrompts((prev) =>
      prev.map((p) => (p.key === activeKey ? { ...p, body: res.body } : p))
    );
    setMessage({ type: "ok", text: "Prompt reset to default." });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/programs/ai"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            AI Coach
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold text-gray-900">AI prompts</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={pending || resetting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reset default
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={pending || !isDirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Templates
          </p>
          <nav className="space-y-1">
            {prompts.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setActiveKey(p.key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  p.key === activeKey
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-gray-900">{active.label}</h2>
              {active.description && (
                <p className="mt-1 text-sm text-gray-500">{active.description}</p>
              )}
            </div>

            {message && (
              <div
                className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
                  message.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="min-h-[420px] flex-1 w-full resize-y rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm leading-relaxed text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="mt-2 text-xs text-gray-500">
              {isDirty ? "Unsaved changes" : "Saved"}
              {active.updated_at
                ? ` · Last updated ${new Date(active.updated_at).toLocaleString()}`
                : ""}
            </p>
          </div>

          <aside className="w-full shrink-0 border-t border-gray-200 bg-white p-6 lg:w-72 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-semibold text-gray-900">Placeholders</h3>
            <p className="mt-1 text-xs text-gray-500">
              Use <code className="rounded bg-gray-100 px-1">{"{{name}}"}</code> in the prompt.
              These are replaced at runtime.
            </p>
            <ul className="mt-4 space-y-3">
              {AI_PROMPT_PLACEHOLDERS[activeKey].map((ph) => (
                <li key={ph.name}>
                  <button
                    type="button"
                    onClick={() => setDraft(`${draft}{{${ph.name}}}`)}
                    className="font-mono text-xs font-medium text-[#6b8f00] hover:underline"
                  >
                    {`{{${ph.name}}}`}
                  </button>
                  <p className="mt-0.5 text-xs text-gray-500">{ph.description}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
