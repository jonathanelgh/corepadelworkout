"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Image as ImageIcon, Info, Save, Video } from "lucide-react";
import { updateExercise } from "../../actions";
import {
  MultiSelectSearchChips,
  type MultiSelectOption,
} from "@/components/admin/multi-select-search-chips";
import { ExerciseMediaPickerModal } from "@/components/admin/exercise-media-picker-modal";
import { VideoUrlPreview } from "@/components/media/video-url-preview";
import type { ExerciseListItem } from "../../types";

type LocationOption = { id: string; name: string; slug: string };

const TABS = [
  { id: "basic", label: "Basic Info", icon: Info },
  { id: "media", label: "Media", icon: ImageIcon },
];

export function EditExerciseForm({
  initial,
  locations,
  locationsError,
  equipmentOptions,
  categoryTypeOptions,
  movementPatternOptions,
  bodyRegionOptions,
  bodyPartOptions,
  exerciseLevelOptions,
  equipmentError,
  categoryTypesError,
  movementPatternsError,
  bodyRegionsError,
  bodyPartsError,
  exerciseLevelsError,
}: {
  initial: ExerciseListItem;
  locations: LocationOption[];
  locationsError?: string | null;
  equipmentOptions: MultiSelectOption[];
  categoryTypeOptions: MultiSelectOption[];
  movementPatternOptions: MultiSelectOption[];
  bodyRegionOptions: MultiSelectOption[];
  bodyPartOptions: MultiSelectOption[];
  exerciseLevelOptions: MultiSelectOption[];
  equipmentError?: string | null;
  categoryTypesError?: string | null;
  movementPatternsError?: string | null;
  bodyRegionsError?: string | null;
  bodyPartsError?: string | null;
  exerciseLevelsError?: string | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(initial.equipmentIds);
  const [selectedCategoryTypeIds, setSelectedCategoryTypeIds] = useState<string[]>(initial.categoryTypeIds);
  const [selectedMovementPatternIds, setSelectedMovementPatternIds] = useState<string[]>(
    initial.movementPatternIds
  );
  const [selectedBodyRegionIds, setSelectedBodyRegionIds] = useState<string[]>(initial.bodyRegionIds);
  const [selectedBodyPartIds, setSelectedBodyPartIds] = useState<string[]>(initial.bodyPartIds);

  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(initial.video_url ?? "");
  const [mediaPicker, setMediaPicker] = useState<null | "image" | "video">(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;

    try {
      const fd = new FormData(form);
      fd.set("video_url", videoUrl.trim());
      fd.set("image_url", imageUrl.trim());
      for (const id of selectedEquipmentIds) {
        fd.append("equipment_ids", id);
      }
      for (const id of selectedCategoryTypeIds) {
        fd.append("exercise_category_type_ids", id);
      }
      for (const id of selectedMovementPatternIds) {
        fd.append("movement_pattern_ids", id);
      }
      for (const id of selectedBodyRegionIds) {
        fd.append("body_region_ids", id);
      }
      for (const id of selectedBodyPartIds) {
        fd.append("body_part_ids", id);
      }

      const result = await updateExercise(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/admin/exercises");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {mediaPicker && (
        <ExerciseMediaPickerModal
          open
          kind={mediaPicker}
          onClose={() => setMediaPicker(null)}
          onChooseUrl={(url) => {
            if (mediaPicker === "image") setImageUrl(url);
            else setVideoUrl(url);
          }}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
        <div className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/admin/exercises"
              className="-ml-1.5 shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-4 w-px shrink-0 bg-gray-200" />
            <h1 className="truncate text-lg font-semibold text-gray-900">Edit exercise</h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              disabled
              className="hidden cursor-not-allowed items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-400 sm:flex"
              title="Coming soon"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="submit"
              form="edit-exercise-form"
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <nav
              className="-mb-px flex gap-1 overflow-x-auto sm:gap-2"
              role="tablist"
              aria-label="Exercise form sections"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors sm:px-2 ${
                      isActive
                        ? "border-black text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${isActive ? "text-black" : "text-gray-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <form key={initial.id} id="edit-exercise-form" onSubmit={onSubmit} className="mx-auto max-w-5xl p-6 lg:p-8">
            <input type="hidden" name="id" value={initial.id} />

            {locationsError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Could not load locations: {locationsError}
              </div>
            )}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className={activeTab === "basic" ? "space-y-6" : "hidden"} aria-hidden={activeTab !== "basic"}>
              <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">General information</h2>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Exercise title <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      required
                      defaultValue={initial.title}
                      placeholder="e.g. Band pull-aparts"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="relative max-w-xs">
                      <select
                        id="status"
                        name="status"
                        defaultValue={initial.status}
                        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="draft">Draft — hidden from member workouts</option>
                        <option value="published">Published — visible in programs</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Video imports start as draft. Publish when metadata and media look good.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="location_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Location <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="location_id"
                        name="location_id"
                        required
                        defaultValue={initial.location_id}
                        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="exercise_level_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Exercise level <span className="text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        id="exercise_level_id"
                        name="exercise_level_id"
                        defaultValue={initial.exerciseLevelId ?? ""}
                        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">None</option>
                        {exerciseLevelOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Short description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={initial.description ?? ""}
                      placeholder="What this exercise targets and why it matters."
                      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Shown in lists and previews.</p>
                  </div>

                  {(equipmentError ||
                    categoryTypesError ||
                    movementPatternsError ||
                    bodyRegionsError ||
                    bodyPartsError ||
                    exerciseLevelsError) && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      {equipmentError && <p>Equipment list: {equipmentError}</p>}
                      {categoryTypesError && <p>Category types: {categoryTypesError}</p>}
                      {movementPatternsError && <p>Movement patterns: {movementPatternsError}</p>}
                      {bodyRegionsError && <p>Body regions: {bodyRegionsError}</p>}
                      {bodyPartsError && <p>Body parts: {bodyPartsError}</p>}
                      {exerciseLevelsError && <p>Exercise levels: {exerciseLevelsError}</p>}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <MultiSelectSearchChips
                      label="Gear / equipment"
                      options={equipmentOptions}
                      value={selectedEquipmentIds}
                      onChange={setSelectedEquipmentIds}
                      searchPlaceholder="Search gear…"
                      emptyListHint="Add items under Exercise equipment first."
                      disabled={pending}
                    />
                    <p className="text-xs text-gray-500">
                      Pick any combination from your equipment library. Manage items in{" "}
                      <Link
                        href="/admin/exercises/equipment"
                        className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-600"
                      >
                        Exercise equipment
                      </Link>
                      .
                    </p>
                  </div>

                  <MultiSelectSearchChips
                    label="Category types"
                    options={categoryTypeOptions}
                    value={selectedCategoryTypeIds}
                    onChange={setSelectedCategoryTypeIds}
                    searchPlaceholder="Search category types…"
                    emptyListHint="No category types in the database yet."
                    disabled={pending}
                  />
                  <MultiSelectSearchChips
                    label="Movement patterns"
                    options={movementPatternOptions}
                    value={selectedMovementPatternIds}
                    onChange={setSelectedMovementPatternIds}
                    searchPlaceholder="Search movement patterns…"
                    emptyListHint="No movement patterns in the database yet."
                    disabled={pending}
                  />
                  <MultiSelectSearchChips
                    label="Body regions"
                    options={bodyRegionOptions}
                    value={selectedBodyRegionIds}
                    onChange={setSelectedBodyRegionIds}
                    searchPlaceholder="Search body regions…"
                    emptyListHint="No body regions in the database yet."
                    disabled={pending}
                  />
                  <MultiSelectSearchChips
                    label="Body parts"
                    options={bodyPartOptions}
                    value={selectedBodyPartIds}
                    onChange={setSelectedBodyPartIds}
                    searchPlaceholder="Search body parts…"
                    emptyListHint="No body parts in the database yet."
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">How to do it</h2>
                <div>
                  <label htmlFor="how_to" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Instructions
                  </label>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="h-6 w-6 rounded bg-gray-200" />
                      <div className="h-6 w-6 rounded bg-gray-200" />
                      <div className="h-6 w-6 rounded bg-gray-200" />
                      <div className="mx-1 h-4 w-px bg-gray-300" />
                      <div className="h-6 w-6 rounded bg-gray-200" />
                    </div>
                    <textarea
                      id="how_to"
                      name="how_to"
                      rows={8}
                      defaultValue={initial.how_to ?? ""}
                      placeholder="Step-by-step cues, reps/sets if relevant, common mistakes."
                      className="w-full resize-y bg-white px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("media")}
                  className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Continue to Media
                </button>
              </div>
            </div>

            <div className={activeTab === "media" ? "space-y-6" : "hidden"} aria-hidden={activeTab !== "media"}>
              <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Cover image</h2>
                <p className="mb-6 text-sm text-gray-500">
                  Choose from the media library, upload a new file, or paste an image URL. Used in cards and detail
                  views.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:h-40 sm:w-56">
                    {imageUrl.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin: arbitrary image URLs
                      <img src={imageUrl.trim()} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-300" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <button
                      type="button"
                      onClick={() => setMediaPicker("image")}
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Choose image
                    </button>
                    {imageUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="ml-0 block text-sm font-medium text-red-600 hover:text-red-700 sm:ml-2 sm:inline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative my-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium tracking-wider text-gray-400 uppercase">or</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div>
                  <label htmlFor="image_url" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    id="image_url"
                    name="image_url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Paste a link if the image is hosted elsewhere.</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Demo video</h2>
                <p className="mb-6 text-sm text-gray-500">
                  Choose from the media library, upload a new file, or paste a link. Third-party embeds supported: YouTube,
                  Vimeo, Google Drive (file shared for viewing), Loom, Dailymotion, or a direct MP4/WebM URL.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-h-[11rem] w-full shrink-0 items-stretch justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:min-h-[12rem] sm:w-72">
                    {videoUrl.trim() ? (
                      <VideoUrlPreview url={videoUrl} label="Demo video preview" />
                    ) : (
                      <div className="flex h-full min-h-[10rem] w-full items-center justify-center">
                        <Video className="h-12 w-12 text-gray-300" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <button
                      type="button"
                      onClick={() => setMediaPicker("video")}
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Choose video
                    </button>
                    {videoUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => setVideoUrl("")}
                        className="ml-0 block text-sm font-medium text-red-600 hover:text-red-700 sm:ml-2 sm:inline"
                      >
                        Remove video
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative my-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium tracking-wider text-gray-400 uppercase">or</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div>
                  <label htmlFor="video_url" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Video URL
                  </label>
                  <input
                    id="video_url"
                    name="video_url"
                    type="url"
                    inputMode="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/…, vimeo.com/…, or direct .mp4"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Use a public link. For Google Drive, use &quot;Anyone with the link&quot; can view the file.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Library and uploads require a signed-in admin account. External URLs work without uploading.
              </p>

              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className="rounded-lg px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
