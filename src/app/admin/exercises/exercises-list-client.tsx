"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { ExerciseRowActions } from "./exercise-row-actions";
import type { ExerciseListFilters, ExerciseListItem } from "./types";

type ActiveFilters = {
  status: "" | "published" | "draft";
  locationId: string;
  equipmentId: string;
  levelId: string;
  categoryTypeId: string;
  movementPatternId: string;
  bodyRegionId: string;
  bodyPartId: string;
};

const EMPTY_FILTERS: ActiveFilters = {
  status: "",
  locationId: "",
  equipmentId: "",
  levelId: "",
  categoryTypeId: "",
  movementPatternId: "",
  bodyRegionId: "",
  bodyPartId: "",
};

function matchesExerciseQuery(ex: ExerciseListItem, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  if (ex.title.toLowerCase().includes(n)) return true;
  if (ex.description?.toLowerCase().includes(n)) return true;
  if (ex.how_to?.toLowerCase().includes(n)) return true;
  if (ex.locationName?.toLowerCase().includes(n)) return true;
  if (ex.locationNames.some((label) => label.toLowerCase().includes(n))) return true;
  if (ex.equipmentLabels.some((label) => label.toLowerCase().includes(n))) return true;
  if (ex.exerciseLevelLabel?.toLowerCase().includes(n)) return true;
  if (ex.categoryTypeLabels.some((label) => label.toLowerCase().includes(n))) return true;
  if (ex.movementPatternLabels.some((label) => label.toLowerCase().includes(n))) return true;
  if (ex.bodyRegionLabels.some((label) => label.toLowerCase().includes(n))) return true;
  if (ex.bodyPartLabels.some((label) => label.toLowerCase().includes(n))) return true;
  return false;
}

function matchesExerciseFilters(ex: ExerciseListItem, f: ActiveFilters): boolean {
  if (f.status && ex.status !== f.status) return false;
  if (f.locationId && !ex.locationIds.includes(f.locationId)) return false;
  if (f.equipmentId && !ex.equipmentIds.includes(f.equipmentId)) return false;
  if (f.levelId && ex.exerciseLevelId !== f.levelId) return false;
  if (f.categoryTypeId && !ex.categoryTypeIds.includes(f.categoryTypeId)) return false;
  if (f.movementPatternId && !ex.movementPatternIds.includes(f.movementPatternId)) return false;
  if (f.bodyRegionId && !ex.bodyRegionIds.includes(f.bodyRegionId)) return false;
  if (f.bodyPartId && !ex.bodyPartIds.includes(f.bodyPartId)) return false;
  return true;
}

function hasActiveFilters(f: ActiveFilters): boolean {
  return Object.values(f).some((v) => v !== "");
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  emptyLabel = "All",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  emptyLabel?: string;
}) {
  if (options.length === 0) return null;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">{emptyLabel}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ExercisesListClient({
  rows,
  filters,
}: {
  rows: ExerciseListItem[];
  filters: ExerciseListFilters;
}) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  const filtered = useMemo(
    () =>
      rows.filter(
        (ex) => matchesExerciseQuery(ex, query.trim()) && matchesExerciseFilters(ex, activeFilters)
      ),
    [rows, query, activeFilters]
  );

  function setFilter<K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  }

  const filtersActive = hasActiveFilters(activeFilters);

  return (
    <>
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, gear, description, location…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            aria-label="Search exercises"
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Filter by</p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => setActiveFilters(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          <FilterSelect
            id="filter-status"
            label="Status"
            value={activeFilters.status}
            onChange={(v) => setFilter("status", v as ActiveFilters["status"])}
            options={[
              { id: "published", label: "Published" },
              { id: "draft", label: "Draft" },
            ]}
            emptyLabel="All statuses"
          />
          <FilterSelect
            id="filter-location"
            label="Location"
            value={activeFilters.locationId}
            onChange={(v) => setFilter("locationId", v)}
            options={filters.locations}
          />
          <FilterSelect
            id="filter-equipment"
            label="Equipment"
            value={activeFilters.equipmentId}
            onChange={(v) => setFilter("equipmentId", v)}
            options={filters.equipment}
          />
          <FilterSelect
            id="filter-level"
            label="Level"
            value={activeFilters.levelId}
            onChange={(v) => setFilter("levelId", v)}
            options={filters.levels}
          />
          <FilterSelect
            id="filter-category"
            label="Category"
            value={activeFilters.categoryTypeId}
            onChange={(v) => setFilter("categoryTypeId", v)}
            options={filters.categoryTypes}
          />
          <FilterSelect
            id="filter-movement"
            label="Movement"
            value={activeFilters.movementPatternId}
            onChange={(v) => setFilter("movementPatternId", v)}
            options={filters.movementPatterns}
          />
          <FilterSelect
            id="filter-region"
            label="Body region"
            value={activeFilters.bodyRegionId}
            onChange={(v) => setFilter("bodyRegionId", v)}
            options={filters.bodyRegions}
          />
          <FilterSelect
            id="filter-part"
            label="Body part"
            value={activeFilters.bodyPartId}
            onChange={(v) => setFilter("bodyPartId", v)}
            options={filters.bodyParts}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
                <th className="px-6 py-4 font-medium">Exercise</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Level</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Gear</th>
                <th className="px-6 py-4 font-medium">Media</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                    {rows.length === 0 ? (
                      <>
                        <p className="mb-1 font-medium text-gray-900">No exercises yet</p>
                        <p className="mb-4 text-sm">Create your first exercise to use it across programs.</p>
                        <Link
                          href="/admin/exercises/new"
                          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                          <Plus className="h-4 w-4" />
                          Create exercise
                        </Link>
                      </>
                    ) : (
                      <>No matches for your search or filters.</>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((ex) => {
                  const hasVideo = Boolean(ex.video_url?.trim());
                  const hasImage = Boolean(ex.image_url?.trim());
                  const created = new Date(ex.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <tr key={ex.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{ex.title}</div>
                        {ex.description && (
                          <div className="mt-0.5 line-clamp-2 max-w-md text-gray-500">{ex.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                            ex.status === "published"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-900 border border-amber-200"
                          }`}
                        >
                          {ex.status === "published" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {ex.exerciseLevelLabel ? (
                          <span className="inline-flex items-center rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 border border-violet-200">
                            {ex.exerciseLevelLabel}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {ex.locationNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ex.locationNames.map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[220px] px-6 py-4 text-gray-600">
                        {ex.equipmentLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ex.equipmentLabels.map((g) => (
                              <span
                                key={g}
                                className="inline-flex max-w-full truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-800"
                                title={g}
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex gap-2">
                          {hasVideo && (
                            <span className="rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                              Video
                            </span>
                          )}
                          {hasImage && (
                            <span className="rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                              Image
                            </span>
                          )}
                          {!hasVideo && !hasImage && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{created}</td>
                      <td className="px-6 py-4 text-right">
                        <ExerciseRowActions exerciseId={ex.id} exerciseTitle={ex.title} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 text-sm text-gray-500">
            Showing {filtered.length} of {rows.length} exercise{rows.length === 1 ? "" : "s"}
            {filtersActive ? " (filtered)" : ""}
          </div>
        )}
      </div>
    </>
  );
}
