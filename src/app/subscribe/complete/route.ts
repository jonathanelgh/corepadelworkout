import { redirect } from "next/navigation";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";
import { syncStripeSubscriptionFromCheckoutSession } from "@/lib/stripe/sync-subscription";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/subscribe")}`);
  }

  if (!sessionId) {
    redirect("/subscribe");
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.user_id !== user.id) {
    redirect("/subscribe");
  }

  await syncStripeSubscriptionFromCheckoutSession(session);
  redirect(await resolvePostAuthRedirect(supabase, user.id));
}
