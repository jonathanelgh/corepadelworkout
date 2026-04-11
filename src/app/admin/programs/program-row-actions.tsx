"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Copy, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { deleteProgram, duplicateProgram } from "./actions";

const MENU_W = 208;

export function ProgramRowActions({
  programId,
  programTitle,
  programSlug,
}: {
  programId: string;
  programTitle: string;
  programSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - MENU_W, window.innerWidth - MENU_W - 8));
    setMenuStyle({ top: rect.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const panel =
    open &&
    mounted && (
      <>
        <div className="fixed inset-0 z-100" aria-hidden onClick={() => setOpen(false)} />
        <div
          id={menuId}
          role="menu"
          className="fixed z-101 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          style={{ top: menuStyle.top, left: menuStyle.left }}
        >
          <Link
            href={`/programs/${programSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Eye className="h-4 w-4 shrink-0 text-gray-500" />
            View live
          </Link>
          <Link
            href={`/admin/programs/${programId}/edit`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Edit className="h-4 w-4 shrink-0 text-gray-500" />
            Edit
          </Link>
          <form action={duplicateProgram}>
            <input type="hidden" name="program_id" value={programId} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4 shrink-0 text-gray-500" />
              Duplicate
            </button>
          </form>
          <div className="my-1 h-px bg-gray-100" />
          <form action={deleteProgram}>
            <input type="hidden" name="program_id" value={programId} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={(e) => {
                if (
                  !confirm(
                    `Delete "${programTitle}"? This removes the program, curriculum, and enrollments tied to it. This cannot be undone.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete
            </button>
          </form>
        </div>
      </>
    );

  return (
    <div className="relative flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open actions for {programTitle}</span>
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
