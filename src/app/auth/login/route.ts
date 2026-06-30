import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";

function loginRedirectUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/login", request.url);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const next = (formData.get("next") as string)?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.redirect(
      loginRedirectUrl(request, {
        error: "Email and password are required.",
        next,
      })
    );
  }

  const cookieStore = await cookies();
  let response = NextResponse.redirect(new URL("/member", request.url));

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
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    const friendly =
      msg.includes("invalid login credentials") || msg.includes("invalid credentials")
        ? "Email or password is incorrect. If you signed up with a magic link, use “Email me a sign-in link” on the login page."
        : error.message;

    return NextResponse.redirect(loginRedirectUrl(request, { error: friendly, next }));
  }

  const userId = signInData.user?.id;
  if (!userId) {
    return NextResponse.redirect(
      loginRedirectUrl(request, { error: "Sign in failed. Try again.", next })
    );
  }

  const targetPath = await resolvePostAuthRedirect(supabase, userId, next || null);
  response = NextResponse.redirect(new URL(targetPath, request.url));

  return response;
}
