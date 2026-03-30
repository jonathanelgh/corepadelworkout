"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export type MultiSelectOption = { id: string; label: string };

type Props = {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder?: string;
  emptyListHint?: string;
  noMatchesHint?: string;
  disabled?: boolean;
};

export function MultiSelectSearchChips({
  label,
  options,
  value,
  onChange,
  searchPlaceholder = "Search…",
  emptyListHint = "No items in library yet.",
  noMatchesHint = "No matches.",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const labelById = useMemo(() => new Map(options.map((o) => [o.id, o.label])), [options]);

  const available = useMemo(() => {
    const selected = new Set(value);
    const needle = q.trim().toLowerCase();
    return options.filter(
      (o) => !selected.has(o.id) && (needle === "" || o.label.toLowerCase().includes(needle))
    );
  }, [options, value, q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function addId(id: string) {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setQ("");
    setOpen(false);
  }

  function removeId(id: string) {
    onChange(value.filter((x) => x !== id));
  }

  return (
    <div ref={rootRef} className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-800"
            >
              <span className="max-w-[200px] truncate">{labelById.get(id) ?? id}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeId(id)}
                className="rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-40"
                aria-label={`Remove ${labelById.get(id) ?? id}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">None selected.</p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={q}
          disabled={disabled || options.length === 0}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={options.length === 0 ? emptyListHint : searchPlaceholder}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none disabled:bg-gray-50"
          autoComplete="off"
        />
        {open && !disabled && options.length > 0 && (
          <ul
            className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            {available.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{noMatchesHint}</li>
            ) : (
              available.map((o) => (
                <li key={o.id} role="option">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                    onClick={() => addId(o.id)}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
