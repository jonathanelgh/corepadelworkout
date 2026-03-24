"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

export type ExerciseOption = { id: string; title: string; location_id: string };

type Props = {
  exercises: ExerciseOption[];
  value: string;
  onChange: (exerciseId: string) => void;
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
};

const MENU_Z = 9999;

export function ExerciseSearchCombobox({
  exercises,
  value,
  onChange,
  excludeIds = [],
  placeholder = "Search exercises…",
  disabled = false,
}: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);

  const selected = useMemo(
    () => exercises.find((e) => e.id === value) ?? null,
    [exercises, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (exclude.has(e.id)) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q);
    });
  }, [exercises, exclude, query]);

  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setHighlight(0);
  }, [query, open, filtered.length]);

  const updatePosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const ro = new ResizeObserver(() => updatePosition());
    if (inputRef.current) ro.observe(inputRef.current);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handleDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (portalRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, [open]);

  const pick = useCallback(
    (id: string) => {
      onChange(id);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  /** When open, input shows what you type; when closed, show selected label */
  const inputValue = open ? query : selected?.title ?? "";

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const onInputFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setQuery("");
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      const row = filtered[highlight];
      if (row) pick(row.id);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const listContent = (
    <ul className="max-h-[min(320px,40vh)] overflow-y-auto p-1" role="presentation">
      {filtered.length === 0 ? (
        <li className="px-3 py-8 text-center text-sm text-gray-500">No matches</li>
      ) : (
        filtered.map((ex, i) => (
          <li key={ex.id} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === ex.id}
              className={`flex w-full rounded-md px-3 py-2 text-left text-sm ${
                i === highlight ? "bg-gray-100" : "hover:bg-gray-50"
              } ${value === ex.id ? "font-medium text-gray-900" : "text-gray-800"}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(ex.id)}
            >
              <span className="truncate">{ex.title}</span>
            </button>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={uid}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          onChange={onInputChange}
          onFocus={onInputFocus}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          className={`w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        />
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </div>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={portalRef}
            id={listId}
            role="listbox"
            aria-label="Exercises"
            className="fixed overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: MENU_Z,
            }}
          >
            {listContent}
          </div>,
          document.body
        )}
    </div>
  );
}
