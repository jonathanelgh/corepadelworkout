"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Image as ImageIcon, Info, Save, Sparkles, Video } from "lucide-react";
import { BulkExerciseVideoImportModal } from "@/components/admin/bulk-exercise-video-import-modal";
import { createExercise } from "../actions";
import {
  MultiSelectSearchChips,
  type MultiSelectOption,
} from "@/components/admin/multi-select-search-chips";
import { ExerciseMediaPickerModal } from "@/components/admin/exercise-media-picker-modal";
import { VideoUrlPreview } from "@/components/media/video-url-preview";

type LocationOption = { id: string; name: string; slug: string };

const TABS = [
  { id: "basic", label: "Basic Info", icon: Info },
  { id: "media", label: "Media", icon: ImageIcon },
];

export function CreateExerciseForm({
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
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [selectedCategoryTypeIds, setSelectedCategoryTypeIds] = useState<string[]>([]);
  const [selectedMovementPatternIds, setSelectedMovementPatternIds] = useState<string[]>([]);
  const [selectedBodyRegionIds, setSelectedBodyRegionIds] = useState<string[]>([]);
  const [selectedBodyPartIds, setSelectedBodyPartIds] = useState<string[]>([]);

  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaPicker, setMediaPicker] = useState<null | "image" | "video">(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const locationOptions = locations.map((loc) => ({ id: loc.id, label: loc.name }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;

    try {
      const fd = new FormData(form);
      fd.set("video_url", videoUrl.trim());
      fd.set("image_url", imageUrl.trim());
      for (const id of selectedLocationIds) {
        fd.append("location_ids", id);
      }
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

      const result = await createExercise(fd);
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
      <BulkExerciseVideoImportModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />
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
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-0">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 shrink-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/admin/exercises"
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-gray-200 shrink-0" />
          <h1 className="text-lg font-semibold text-gray-900 truncate">Create exercise</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setBulkImportOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors sm:px-4"
          >
            <Sparkles className="w-4 h-4 text-[#ccff00]" />
            <span className="hidden sm:inline">Bulk upload videos</span>
            <span className="sm:hidden">Bulk</span>
          </button>
          <button
            type="button"
            disabled
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed"
            title="Coming soon"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="submit"
            form="create-exercise-form"
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {pending ? "Saving…" : "Create exercise"}
          </button>
        </div>
      </div>

      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <nav
            className="flex gap-1 sm:gap-2 overflow-x-auto -mb-px"
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

      <div className="flex-1 min-h-0 overflow-auto">
        <form id="create-exercise-form" onSubmit={onSubmit} className="max-w-5xl mx-auto p-6 lg:p-8">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">General information</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Exercise title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    required
                    placeholder="e.g. Band pull-aparts"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <MultiSelectSearchChips
                    label="Locations"
                    options={locationOptions}
                    value={selectedLocationIds}
                    onChange={setSelectedLocationIds}
                    searchPlaceholder="Search locations…"
                    emptyListHint="No locations in the database yet."
                    disabled={pending}
                  />
                  <p className="text-xs text-gray-500">
                    Select every place this exercise can be performed (e.g. Gym and Home).
                  </p>
                </div>

                <div>
                  <label htmlFor="exercise_level_id" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Exercise level <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      id="exercise_level_id"
                      name="exercise_level_id"
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      defaultValue=""
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Short description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="What this exercise targets and why it matters."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
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

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">How to do it</h2>
              <div>
                <label htmlFor="how_to" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Instructions
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                  </div>
                  <textarea
                    id="how_to"
                    name="how_to"
                    rows={8}
                    placeholder="Step-by-step cues, reps/sets if relevant, common mistakes."
                    className="w-full px-4 py-3 bg-white text-sm focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Continue to Media
              </button>
            </div>
          </div>

          <div className={activeTab === "media" ? "space-y-6" : "hidden"} aria-hidden={activeTab !== "media"}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Cover image</h2>
              <p className="text-sm text-gray-500 mb-6">
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

              <div className="relative flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image URL
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
                <p className="mt-1.5 text-xs text-gray-500">Paste a link if the image is hosted elsewhere.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Demo video</h2>
              <p className="text-sm text-gray-500 mb-6">
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

              <div className="relative flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

                <div>
                <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={pending}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {pending ? "Saving…" : "Create exercise"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
