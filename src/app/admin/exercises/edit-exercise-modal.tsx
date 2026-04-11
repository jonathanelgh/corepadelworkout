"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateExercise } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { STORAGE_BUCKETS } from "@/utils/supabase/storage";
import {
  MultiSelectSearchChips,
  type MultiSelectOption,
} from "@/components/admin/multi-select-search-chips";

export type ExerciseListItem = {
  id: string;
  title: string;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
  location_id: string;
  created_at: string;
  locationName: string | null;
  equipmentIds: string[];
  tabIds: string[];
  categoryTypeIds: string[];
  movementPatternIds: string[];
  bodyRegionIds: string[];
};

type LocationOption = { id: string; name: string; slug: string };

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

export function EditExerciseModal({
  item,
  locations,
  equipmentOptions,
  tagOptions,
  categoryTypeOptions,
  movementPatternOptions,
  bodyRegionOptions,
  onClose,
}: {
  item: ExerciseListItem | null;
  locations: LocationOption[];
  equipmentOptions: MultiSelectOption[];
  tagOptions: MultiSelectOption[];
  categoryTypeOptions: MultiSelectOption[];
  movementPatternOptions: MultiSelectOption[];
  bodyRegionOptions: MultiSelectOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCategoryTypeIds, setSelectedCategoryTypeIds] = useState<string[]>([]);
  const [selectedMovementPatternIds, setSelectedMovementPatternIds] = useState<string[]>([]);
  const [selectedBodyRegionIds, setSelectedBodyRegionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!item) return;
    setError(null);
    setPending(false);
    setImageFile(null);
    setVideoFile(null);
    setSelectedEquipmentIds(item.equipmentIds);
    setSelectedTagIds(item.tabIds);
    setSelectedCategoryTypeIds(item.categoryTypeIds);
    setSelectedMovementPatternIds(item.movementPatternIds);
    setSelectedBodyRegionIds(item.bodyRegionIds);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose, pending]);

  if (!item) return null;

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
      for (const id of selectedTagIds) {
        fd.append("exercise_tab_ids", id);
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

      const result = await updateExercise(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={() => !pending && onClose()}
        disabled={pending}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Edit exercise
          </h2>
          <button
            type="button"
            onClick={() => !pending && onClose()}
            disabled={pending}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form key={item.id} onSubmit={onSubmit} className="space-y-5 px-6 py-5">
          <input type="hidden" name="id" value={item.id} />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <div>
            <label htmlFor={`edit-ex-title-${item.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              id={`edit-ex-title-${item.id}`}
              name="title"
              required
              defaultValue={item.title}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor={`edit-ex-loc-${item.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Location <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <select
                id={`edit-ex-loc-${item.id}`}
                name="location_id"
                required
                defaultValue={item.location_id}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
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
            <label htmlFor={`edit-ex-desc-${item.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Short description
            </label>
            <textarea
              id={`edit-ex-desc-${item.id}`}
              name="description"
              rows={3}
              defaultValue={item.description ?? ""}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

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
            label="Tags"
            options={tagOptions}
            value={selectedTagIds}
            onChange={setSelectedTagIds}
            searchPlaceholder="Search tags…"
            emptyListHint="Add tags in Exercise tags first."
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

          <div>
            <label htmlFor={`edit-ex-how-${item.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              How to
            </label>
            <textarea
              id={`edit-ex-how-${item.id}`}
              name="how_to"
              rows={5}
              defaultValue={item.how_to ?? ""}
              className="w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-900">Replace media (optional)</p>
            <p className="mb-3 text-xs text-gray-500">
              New uploads override URLs below for this save. Leave files empty to keep existing media.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">New image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="w-full text-sm text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
                {imageFile && (
                  <p className="mt-1 truncate text-xs text-gray-600">{imageFile.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">New video file</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  className="w-full text-sm text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
                {videoFile && (
                  <p className="mt-1 truncate text-xs text-gray-600">{videoFile.name}</p>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor={`edit-ex-img-url-${item.id}`} className="mb-1 block text-xs font-medium text-gray-600">
                  Image URL
                </label>
                <input
                  id={`edit-ex-img-url-${item.id}`}
                  name="image_url"
                  type="url"
                  defaultValue={item.image_url ?? ""}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor={`edit-ex-vid-url-${item.id}`} className="mb-1 block text-xs font-medium text-gray-600">
                  Video URL
                </label>
                <input
                  id={`edit-ex-vid-url-${item.id}`}
                  name="video_url"
                  type="url"
                  defaultValue={item.video_url ?? ""}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => !pending && onClose()}
              disabled={pending}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
