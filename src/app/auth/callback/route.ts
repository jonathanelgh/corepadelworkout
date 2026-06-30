import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";
import { redeemEarlyAccessPro } from "@/lib/pre-launch/early-access";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const tokenRaw = user.user_metadata?.early_access_token;
        const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";
        if (token) {
          await redeemEarlyAccessPro({
            userId: user.id,
            email: user.email,
            token,
          });
        }
      }
      const safeNext =
        user != null
          ? await resolvePostAuthRedirect(supabase, user.id, next)
          : next.startsWith("/") && !next.startsWith("//")
            ? next
            : "/onboarding";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/signup?error=auth`);
}
