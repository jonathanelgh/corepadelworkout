import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";

/** After form POST, use 303 so the browser follows with GET (307 would re-POST to /login → 405). */
const POST_FORM_REDIRECT = 303;

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
      }),
      POST_FORM_REDIRECT
    );
  }

  const cookieStore = await cookies();
  const sessionCookies: { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }[] =
    [];

  function redirectWithSessionCookies(url: URL) {
    const response = NextResponse.redirect(url, POST_FORM_REDIRECT);
    for (const { name, value, options } of sessionCookies) {
      cookieStore.set(name, value, options);
      response.cookies.set(name, value, options);
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            sessionCookies.push(cookie);
          }
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

    return NextResponse.redirect(loginRedirectUrl(request, { error: friendly, next }), POST_FORM_REDIRECT);
  }

  const userId = signInData.user?.id;
  if (!userId) {
    return NextResponse.redirect(
      loginRedirectUrl(request, { error: "Sign in failed. Try again.", next }),
      POST_FORM_REDIRECT
    );
  }

  const targetPath = await resolvePostAuthRedirect(supabase, userId, next || null);
  return redirectWithSessionCookies(new URL(targetPath, request.url));
}
