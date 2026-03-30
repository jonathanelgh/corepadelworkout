import Link from "next/link";
import { Package } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { AddEquipmentModal } from "./add-equipment-modal";
import { EquipmentListClient, type EquipmentListItem } from "./equipment-list-client";

export const dynamic = "force-dynamic";

type Search = Promise<{ error?: string; saved?: string }>;

export default async function AdminEquipmentPage({ searchParams }: { searchParams?: Search }) {
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("equipment")
    .select("id, title, description, image_url, created_at")
    .order("title", { ascending: true });

  const list: EquipmentListItem[] = (rows ?? []) as EquipmentListItem[];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Package className="h-5 w-5 shrink-0 text-gray-600" />
          <h1 className="truncate text-lg font-semibold text-gray-900">Exercise equipment</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <AddEquipmentModal />
          <Link
            href="/admin/exercises"
            className="text-sm text-gray-600 underline-offset-4 hover:text-black hover:underline"
          >
            Back to exercises
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {sp.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {sp.error}
            </div>
          )}
          {sp.saved && !sp.error && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Saved.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load equipment: {error.message}
            </div>
          )}

          <EquipmentListClient items={list} />
        </div>
      </div>
    </div>
  );
}
