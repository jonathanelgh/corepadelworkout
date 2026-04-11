import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { redirect } from "next/navigation";
import { MediaLibraryClient } from "./media-library-client";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/media");
  }

  return <MediaLibraryClient />;
}
