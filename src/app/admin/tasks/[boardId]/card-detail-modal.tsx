"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MessageSquare, Trash2, X } from "lucide-react";
import { Check } from "lucide-react";
import { addTaskCardComment, deleteTaskCard, listTaskCardComments, setTaskCardCompleted, updateTaskCard } from "../actions";
import type { AssigneeOption, TaskCardComment, TaskCardData } from "../types";

function formatCommentTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CardDetailModal({
  card,
  boardId,
  assigneeOptions,
  onClose,
  onUpdated,
}: {
  card: TaskCardData;
  boardId: string;
  assigneeOptions: AssigneeOption[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(card.assigneeIds);
  const [completed, setCompleted] = useState(card.completed);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskCardComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [commentPending, setCommentPending] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    void listTaskCardComments(card.id).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        setComments([]);
      } else {
        setComments(res);
      }
      setCommentsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
    setDueDate(card.dueDate ?? "");
    setAssigneeIds(card.assigneeIds);
    setCompleted(card.completed);
  }, [card]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleToggleCompleted() {
    const next = !completed;
    setCompleted(next);
    setError(null);
    const res = await setTaskCardCompleted(card.id, boardId, next);
    if ("error" in res) {
      setCompleted(completed);
      setError(res.error);
      return;
    }
    onUpdated();
  }

  async function handleSave() {
    setError(null);
    setPending(true);
    const res = await updateTaskCard({
      cardId: card.id,
      boardId,
      title,
      description,
      dueDate: dueDate || null,
      completed,
      assigneeIds,
    });
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onUpdated();
    onClose();
  }

  async function handleAddComment() {
    const text = commentBody.trim();
    if (!text) return;
    setCommentPending(true);
    setError(null);
    const res = await addTaskCardComment(card.id, boardId, text);
    setCommentPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setComments((prev) => [...prev, res.comment]);
    setCommentBody("");
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    setPending(true);
    const res = await deleteTaskCard(card.id, boardId);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onUpdated();
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => !pending && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Task details
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <button
            type="button"
            onClick={() => void handleToggleCompleted()}
            disabled={pending}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                completed ? "border-emerald-600 bg-emerald-600" : "border-gray-300 bg-white"
              }`}
            >
              {completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </span>
            <span className={completed ? "text-gray-500 line-through" : "font-medium text-gray-900"}>
              {completed ? "Completed" : "Mark as complete"}
            </span>
          </button>

          <div>
            <label htmlFor="card-title" className="mb-1.5 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="card-desc" className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="card-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={pending}
              placeholder="Notes, links, acceptance criteria…"
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="card-due" className="mb-1.5 block text-sm font-medium text-gray-700">
              Due date
            </label>
            <input
              id="card-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={pending}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Assignees (admin team)</p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {assigneeOptions.length === 0 ? (
                <p className="text-sm text-gray-500">No users found.</p>
              ) : (
                assigneeOptions.map((u) => {
                  const on = assigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={pending}
                      onClick={() => toggleAssignee(u.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        on
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {u.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Comments</p>
            </div>

            {commentsLoading ? (
              <p className="text-sm text-gray-500">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet.</p>
            ) : (
              <ul className="mb-3 max-h-48 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
                {comments.map((c) => (
                  <li key={c.id} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-gray-900">{c.authorLabel}</span>
                      <time className="shrink-0 text-xs text-gray-400">{formatCommentTime(c.createdAt)}</time>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-gray-700">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={2}
              disabled={commentPending || pending}
              placeholder="Add a comment…"
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleAddComment()}
              disabled={commentPending || pending || !commentBody.trim()}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {commentPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Post comment
            </button>
            <p className="mt-1.5 text-xs text-gray-500">
              The task creator gets an email when someone else comments.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={pending || !title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
