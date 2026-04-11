"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Info,
  Save,
  UploadCloud,
  Video,
} from "lucide-react";
import { createExercise } from "../actions";
import { createClient } from "@/utils/supabase/client";
import { STORAGE_BUCKETS } from "@/utils/supabase/storage";
import {
  MultiSelectSearchChips,
  type MultiSelectOption,
} from "@/components/admin/multi-select-search-chips";

type LocationOption = { id: string; name: string; slug: string };

const TABS = [
  { id: "basic", label: "Basic Info", icon: Info },
  { id: "media", label: "Media", icon: ImageIcon },
];

function extFromFile(file: File, fallback: string) {
  const n = file.name.split(".").pop();
  if (n && n.length <= 5) return n.toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  return fallback;
}

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
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [selectedCategoryTypeIds, setSelectedCategoryTypeIds] = useState<string[]>([]);
  const [selectedMovementPatternIds, setSelectedMovementPatternIds] = useState<string[]>([]);
  const [selectedBodyRegionIds, setSelectedBodyRegionIds] = useState<string[]>([]);
  const [selectedBodyPartIds, setSelectedBodyPartIds] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageDragging, setImageDragging] = useState(false);
  const [videoDragging, setVideoDragging] = useState(false);

  const applyImageFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
  };

  const applyVideoFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("video/")) return;
    setVideoFile(file);
  };

  async function uploadExerciseFile(file: File, kind: "image" | "video"): Promise<string> {
    const supabase = createClient();
    const folder = crypto.randomUUID();
    const ext = extFromFile(file, kind === "image" ? "jpg" : "mp4");
    const path = `${folder}/${kind}.${ext}`;
    const { error: upErr } = await supabase.storage.from(STORAGE_BUCKETS.exercises).upload(path, file, {
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from(STORAGE_BUCKETS.exercises).getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;

    try {
      let videoUrl = ((form.elements.namedItem("video_url") as HTMLInputElement)?.value ?? "").trim();
      let imageUrl = ((form.elements.namedItem("image_url") as HTMLInputElement)?.value ?? "").trim();

      if (videoFile) {
        videoUrl = await uploadExerciseFile(videoFile, "video");
      }
      if (imageFile) {
        imageUrl = await uploadExerciseFile(imageFile, "image");
      }

      const fd = new FormData(form);
      fd.set("video_url", videoUrl);
      fd.set("image_url", imageUrl);
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

                <div>
                  <label htmlFor="location_id" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="location_id"
                      name="location_id"
                      required
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select location…
                      </option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
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

                <MultiSelectSearchChips
                  label="Equipment"
                  options={equipmentOptions}
                  value={selectedEquipmentIds}
                  onChange={setSelectedEquipmentIds}
                  searchPlaceholder="Search equipment…"
                  emptyListHint="Add equipment in Exercise equipment first."
                  disabled={pending}
                />

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
                Upload a key frame or demo still, or paste an image URL. Used in cards and detail views.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload image</label>
                <input
                  id="exercise-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => applyImageFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="exercise-image-upload"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setImageDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setImageDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDragging(false);
                    applyImageFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                    imageDragging ? "border-black bg-gray-100" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP, or GIF</p>
                </label>
                {imageFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <span className="truncate text-sm font-medium text-gray-900">{imageFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        const el = document.getElementById("exercise-image-upload") as HTMLInputElement | null;
                        if (el) el.value = "";
                      }}
                      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
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
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
                <p className="mt-1.5 text-xs text-gray-500">If the image is already hosted elsewhere.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Demo video</h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload a file to your library, or paste a link (Vimeo, YouTube, or direct MP4).
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload video file</label>
                <input
                  id="exercise-video-upload"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  className="sr-only"
                  onChange={(e) => applyVideoFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="exercise-video-upload"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setVideoDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setVideoDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setVideoDragging(false);
                    applyVideoFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                    videoDragging ? "border-black bg-gray-100" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Video className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">MP4, WebM, or MOV — up to bucket limit</p>
                </label>
                {videoFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <Video className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="truncate text-sm font-medium text-gray-900">{videoFile.name}</span>
                      <span className="shrink-0 text-xs text-gray-500">
                        ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        const el = document.getElementById("exercise-video-upload") as HTMLInputElement | null;
                        if (el) el.value = "";
                      }}
                      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
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
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Uploads require a signed-in admin account. URLs can be used without uploading.
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
  );
}
