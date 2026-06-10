"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, User } from "lucide-react";
import {
  createTaskCard,
  createTaskColumn,
  moveTaskCard,
  setTaskCardCompleted,
} from "../actions";
import { CardDetailModal } from "./card-detail-modal";
import type { AssigneeOption, TaskBoardDetail, TaskCardData } from "../types";

function assigneeLabel(id: string, options: AssigneeOption[]): string {
  return options.find((o) => o.id === id)?.label ?? "?";
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

export function BoardClient({
  board,
  assigneeOptions,
}: {
  board: TaskBoardDetail;
  assigneeOptions: AssigneeOption[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState(board.columns);

  useEffect(() => {
    setColumns(board.columns);
  }, [board]);
  const [activeCard, setActiveCard] = useState<TaskCardData | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);
  const [newCardByColumn, setNewCardByColumn] = useState<Record<string, string>>({});
  const [newColumnName, setNewColumnName] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function patchCardCompleted(cardId: string, completed: boolean) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, completed } : c)),
      }))
    );
    if (activeCard?.id === cardId) {
      setActiveCard((c) => (c ? { ...c, completed } : c));
    }
  }

  async function handleToggleCompleted(card: TaskCardData, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !card.completed;
    patchCardCompleted(card.id, next);
    setError(null);
    const res = await setTaskCardCompleted(card.id, board.id, next);
    if ("error" in res) {
      patchCardCompleted(card.id, card.completed);
      setError(res.error);
      return;
    }
    refresh();
  }

  async function handleAddCard(columnId: string) {
    const title = (newCardByColumn[columnId] ?? "").trim();
    if (!title) return;
    setError(null);
    const res = await createTaskCard(board.id, columnId, title);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setNewCardByColumn((p) => ({ ...p, [columnId]: "" }));
    refresh();
  }

  async function handleAddColumn() {
    const name = newColumnName.trim();
    if (!name) return;
    setError(null);
    const res = await createTaskColumn(board.id, name);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setNewColumnName("");
    setShowAddColumn(false);
    refresh();
  }

  function onDragStart(cardId: string) {
    setDraggingCardId(cardId);
  }

  function onDragEnd() {
    setDraggingCardId(null);
    setDropColumnId(null);
  }

  async function onDrop(columnId: string, index: number) {
    const cardId = draggingCardId;
    if (!cardId) return;

    const sourceCol = columns.find((c) => c.cards.some((card) => card.id === cardId));
    if (!sourceCol) return;

    const card = sourceCol.cards.find((c) => c.id === cardId)!;
    const targetCol = columns.find((c) => c.id === columnId);
    if (!targetCol) return;

    const nextColumns = columns.map((col) => {
      if (col.id === sourceCol.id) {
        return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
      }
      return col;
    });

    const updatedTarget = nextColumns.find((c) => c.id === columnId)!;
    const newCards = [...updatedTarget.cards];
    newCards.splice(index, 0, { ...card, columnId });
    const reindexed = newCards.map((c, i) => ({ ...c, sortOrder: i }));

    const finalColumns = nextColumns.map((col) =>
      col.id === columnId ? { ...col, cards: reindexed } : col
    );

    setColumns(finalColumns);
    setDraggingCardId(null);
    setDropColumnId(null);

    const sortOrder = index;
    const res = await moveTaskCard(cardId, board.id, columnId, sortOrder);
    if ("error" in res) {
      setError(res.error);
      setColumns(board.columns);
      return;
    }
    refresh();
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6 lg:px-8">
          <Link
            href="/admin/tasks"
            className="-ml-1.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900">{board.title}</h1>
            {board.description && (
              <p className="truncate text-xs text-gray-500">{board.description}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6">
          <div className="flex h-full min-h-[calc(100vh-12rem)] gap-4 pb-2">
            {columns.map((column) => (
              <div
                key={column.id}
                className={`flex w-72 shrink-0 flex-col rounded-xl border bg-gray-100/80 ${
                  dropColumnId === column.id ? "border-black ring-2 ring-black/10" : "border-gray-200"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropColumnId(column.id);
                }}
                onDragLeave={() => setDropColumnId(null)}
              >
                <div className="flex items-center justify-between px-3 py-3">
                  <h2 className="text-sm font-semibold text-gray-800">{column.name}</h2>
                  <span className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {column.cards.length}
                  </span>
                </div>

                <div
                  className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
                  onDrop={(e) => {
                    e.preventDefault();
                    void onDrop(column.id, column.cards.length);
                  }}
                >
                  {column.cards.map((card, index) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => onDragStart(card.id)}
                      onDragEnd={onDragEnd}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void onDrop(column.id, index);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div
                        className={`group/card flex gap-2.5 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
                          draggingCardId === card.id ? "opacity-50" : ""
                        } ${card.completed ? "bg-gray-50/80" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={(e) => void handleToggleCompleted(card, e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          draggable={false}
                          aria-label={card.completed ? "Mark task incomplete" : "Mark task complete"}
                          className="mt-0.5 hidden shrink-0 rounded focus:outline-none focus-visible:block focus-visible:ring-2 focus-visible:ring-black group-hover/card:block group-focus-within/card:block"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                              card.completed
                                ? "border-emerald-600 bg-emerald-600"
                                : "border-gray-300 bg-white hover:border-gray-400"
                            }`}
                          >
                            {card.completed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCard(card)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p
                            className={`text-sm font-medium ${
                              card.completed ? "text-gray-500 line-through" : "text-gray-900"
                            }`}
                          >
                            {card.title}
                          </p>
                          {card.description && (
                            <p
                              className={`mt-1 line-clamp-2 text-xs ${
                                card.completed ? "text-gray-400 line-through" : "text-gray-500"
                              }`}
                            >
                              {card.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {card.dueDate && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                Due {new Date(card.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {card.assigneeIds.length > 0 && (
                              <div className="flex -space-x-1">
                                {card.assigneeIds.slice(0, 3).map((uid) => (
                                  <span
                                    key={uid}
                                    title={assigneeLabel(uid, assigneeOptions)}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-800 text-[9px] font-bold text-white"
                                  >
                                    {initials(assigneeLabel(uid, assigneeOptions))}
                                  </span>
                                ))}
                                {card.assigneeIds.length > 3 && (
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[9px] font-medium text-gray-600">
                                    +{card.assigneeIds.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            {card.assigneeIds.length === 0 && (
                              <User className="h-3.5 w-3.5 text-gray-300" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-1 flex gap-2 px-1">
                    <input
                      type="text"
                      value={newCardByColumn[column.id] ?? ""}
                      onChange={(e) =>
                        setNewCardByColumn((p) => ({ ...p, [column.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleAddCard(column.id);
                        }
                      }}
                      placeholder="Add a task…"
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-white/60 px-2 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddCard(column.id)}
                      className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900"
                      title="Add task"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="w-72 shrink-0">
              {showAddColumn ? (
                <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                  <input
                    autoFocus
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAddColumn();
                      if (e.key === "Escape") setShowAddColumn(false);
                    }}
                    placeholder="Column name"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAddColumn()}
                      className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddColumn(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddColumn(true)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/50 px-4 py-3 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
                  Add column
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeCard && (
        <CardDetailModal
          card={activeCard}
          boardId={board.id}
          assigneeOptions={assigneeOptions}
          onClose={() => setActiveCard(null)}
          onUpdated={refresh}
        />
      )}
    </>
  );
}
