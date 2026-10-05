import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { redirect } from "next/navigation";
import { ageFromDateOfBirth } from "@/lib/member/date-of-birth";
import { createServiceClient } from "@/utils/supabase/service";
import { UsersListClient, type AdminUserRow, type OfferFilterOption } from "./users-list-client";

export const dynamic = "force-dynamic";

type PadelLevelRel = { name: string } | { name: string }[] | null;

function firstPadelLevelName(rel: PadelLevelRel): string | null {
  if (!rel) return null;
  const row = Array.isArray(rel) ? rel[0] : rel;
  const n = row && typeof row === "object" && "name" in row ? String((row as { name: string }).name).trim() : "";
  return n.length > 0 ? n : null;
}

type SubRow = {
  user_id: string;
  status: string;
  current_period_end: string;
  stripe_subscription_id: string | null;
  subscription_plans:
    | { name: string; grants_all_programs: boolean }
    | { name: string; grants_all_programs: boolean }[]
    | null;
};

type BestSub = {
  endMs: number;
  label: string;
  isPaying: boolean;
  grantsPro: boolean;
};

function bestSubscriptionByUser(rows: SubRow[]): Map<string, BestSub> {
  const now = Date.now();
  const best = new Map<string, BestSub>();
  for (const r of rows) {
    const activeLike = r.status === "active" || r.status === "trialing";
    const endMs = new Date(r.current_period_end).getTime();
    if (!activeLike || !Number.isFinite(endMs) || endMs <= now) continue;

    const planRaw = r.subscription_plans;
    const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    const planName = plan?.name?.trim() || "Subscription";
    const grantsPro = Boolean(plan?.grants_all_programs);
    const isPaying = Boolean(r.stripe_subscription_id?.trim());
    const label = grantsPro
      ? isPaying
        ? "Paying Pro"
        : "Complimentary Pro"
      : planName;

    const prev = best.get(r.user_id);
    // Prefer Pro grants, then paying Stripe over complimentary, then longer remaining period.
    // (Many paying users also have a longer complimentary grant row from offers/admin.)
    if (
      !prev ||
      (grantsPro && !prev.grantsPro) ||
      (grantsPro === prev.grantsPro && isPaying && !prev.isPaying) ||
      (grantsPro === prev.grantsPro && isPaying === prev.isPaying && endMs > prev.endMs)
    ) {
      best.set(r.user_id, { endMs, label, isPaying, grantsPro });
    }
  }
  return best;
}

function accessLabel(
  userId: string,
  subByUser: Map<string, BestSub>,
  enrollmentCount: number,
  offerCodes: string[]
): string {
  const parts: string[] = [];
  const sub = subByUser.get(userId);
  if (sub) parts.push(sub.label);
  if (offerCodes.length > 0) {
    parts.push(`Offer ${offerCodes.join(", ")}`);
  }
  if (parts.length > 0) return parts.join(" · ");
  if (enrollmentCount > 0) {
    return `${enrollmentCount} program${enrollmentCount === 1 ? "" : "s"}`;
  }
  return "—";
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/users");
  }

  // Offer redemptions are service-role only (no admin write policy on redemptions insert path).
  const service = createServiceClient();

  const [profilesRes, subsRes, enrollRes, adminRes, offersRes, redemptionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        profile_image_url,
        created_at,
        onboarding_completed_at,
        date_of_birth,
        padel_levels ( name )
      `
      )
      .order("created_at", { ascending: false }),
    supabase.from("customer_subscriptions").select(`
        user_id,
        status,
        current_period_end,
        stripe_subscription_id,
        subscription_plans ( name, grants_all_programs )
      `),
    supabase.from("program_enrollments").select("user_id").eq("status", "active"),
    supabase.from("admin_users").select("user_id"),
    service.from("signup_offers").select("id, code, name").order("created_at", { ascending: false }),
    service.from("signup_offer_redemptions").select("user_id, offer_id"),
  ]);

  const loadError = [
    profilesRes.error,
    subsRes.error,
    enrollRes.error,
    adminRes.error,
    offersRes.error,
    redemptionsRes.error,
  ]
    .filter(Boolean)
    .map((e) => e!.message)
    .join(" · ");

  const adminIds = new Set((adminRes.data ?? []).map((r) => r.user_id as string));

  const enrollCountByUser = new Map<string, number>();
  for (const row of enrollRes.data ?? []) {
    const uid = row.user_id as string;
    enrollCountByUser.set(uid, (enrollCountByUser.get(uid) ?? 0) + 1);
  }

  const offerById = new Map(
    (offersRes.data ?? []).map((o) => [
      o.id as string,
      { code: String(o.code), name: String(o.name) },
    ])
  );

  const offerCodesByUser = new Map<string, string[]>();
  for (const row of redemptionsRes.data ?? []) {
    const uid = row.user_id as string;
    const offer = offerById.get(row.offer_id as string);
    if (!offer) continue;
    const list = offerCodesByUser.get(uid) ?? [];
    if (!list.includes(offer.code)) list.push(offer.code);
    offerCodesByUser.set(uid, list);
  }

  const subByUser = bestSubscriptionByUser((subsRes.data ?? []) as SubRow[]);

  const offerFilterOptions: OfferFilterOption[] = (offersRes.data ?? []).map((o) => ({
    code: String(o.code),
    name: String(o.name),
  }));

  const rows: AdminUserRow[] = (profilesRes.data ?? []).map((p) => {
    const id = p.id as string;
    const dateOfBirth = (p.date_of_birth as string | null) ?? null;
    const sub = subByUser.get(id) ?? null;
    const offerCodes = offerCodesByUser.get(id) ?? [];
    const hasActivePro = Boolean(sub?.grantsPro);
    return {
      id,
      email: (p.email as string | null) ?? null,
      fullName: (p.full_name as string | null) ?? null,
      profileImageUrl: (p.profile_image_url as string | null) ?? null,
      createdAt: p.created_at as string,
      onboardingCompletedAt: (p.onboarding_completed_at as string | null) ?? null,
      dateOfBirth,
      age: dateOfBirth ? ageFromDateOfBirth(dateOfBirth) : null,
      padelLevelName: firstPadelLevelName(p.padel_levels as PadelLevelRel),
      isAdmin: adminIds.has(id),
      accessLabel: accessLabel(id, subByUser, enrollCountByUser.get(id) ?? 0, offerCodes),
      hasActivePro,
      isPayingPro: hasActivePro && Boolean(sub?.isPaying),
      isComplimentaryPro: hasActivePro && !sub?.isPaying,
      offerCodes,
    };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load all user data: {loadError}
            </div>
          )}

          <UsersListClient rows={rows} offerOptions={offerFilterOptions} />
        </div>
      </div>
    </div>
  );
}
