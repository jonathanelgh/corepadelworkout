import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import {
  MarketingHomePage,
  type FeaturedProgram,
} from "@/components/landing/marketing-home-page";
import { mapProgramRowsToCards, type ProgramRow } from "@/lib/programs/map-program-cards";
import { proMonthlyPriceLabel } from "@/lib/billing/format-subscription-price";

export const metadata: Metadata = {
  title: "Strength & conditioning for padel players",
  description:
    "Professional padel training programs. Move faster, hit harder, and stay injury-free with workouts for the gym, home, or court.",
  openGraph: {
    title: "Core Padel Workout",
    description:
      "Professional padel training programs. Move faster, hit harder, and stay injury-free.",
    url: "/",
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const [programsRes, planRes] = await Promise.all([
    supabase
      .from("programs")
      .select(
        `
        slug,
        title,
        description,
        cover_image_url,
        duration_weeks,
        program_categories (
          sort_order,
          categories ( name )
        ),
        difficulty_levels ( name )
      `
      )
      .eq("status", "published")
      .eq("program_format", "training_plan")
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("subscription_plans")
      .select("price_amount, currency, interval")
      .eq("slug", "pro-monthly")
      .eq("active", true)
      .maybeSingle(),
  ]);

  const featuredPrograms: FeaturedProgram[] = mapProgramRowsToCards(
    programsRes.data as ProgramRow[] | null
  ).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    image: p.image,
  }));

  return (
    <MarketingHomePage
      featuredPrograms={featuredPrograms}
      proPriceLabel={proMonthlyPriceLabel(planRes.data)}
    />
  );
}
