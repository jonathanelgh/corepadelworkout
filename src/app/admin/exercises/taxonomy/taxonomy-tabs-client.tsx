"use client";

import { useState, type ReactNode } from "react";

type TaxonomyTabId = "category" | "movement" | "body" | "bodyPart" | "level";

const TABS: { id: TaxonomyTabId; label: string }[] = [
  { id: "category", label: "Category types" },
  { id: "movement", label: "Movement patterns" },
  { id: "body", label: "Body regions" },
  { id: "bodyPart", label: "Body parts" },
  { id: "level", label: "Exercise level" },
];

export function TaxonomyTabsClient({
  announcements,
  categoryPanel,
  movementPanel,
  bodyPanel,
  bodyPartPanel,
  levelPanel,
}: {
  announcements?: ReactNode;
  categoryPanel: ReactNode;
  movementPanel: ReactNode;
  bodyPanel: ReactNode;
  bodyPartPanel: ReactNode;
  levelPanel: ReactNode;
}) {
  const [tab, setTab] = useState<TaxonomyTabId>("category");

  const panels: Record<TaxonomyTabId, ReactNode> = {
    category: categoryPanel,
    movement: movementPanel,
    body: bodyPanel,
    bodyPart: bodyPartPanel,
    level: levelPanel,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <nav
            className="-mb-px flex gap-1 overflow-x-auto sm:gap-2"
            role="tablist"
            aria-label="Taxonomy lists"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  id={`taxonomy-tab-${t.id}`}
                  aria-controls={`taxonomy-panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:px-3 ${
                    active
                      ? "border-black text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-gray-50">
        <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
          {announcements}
          <div
            role="tabpanel"
            id={`taxonomy-panel-${tab}`}
            aria-labelledby={`taxonomy-tab-${tab}`}
          >
            {panels[tab]}
          </div>
        </div>
      </div>
    </div>
  );
}
