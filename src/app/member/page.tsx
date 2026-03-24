import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { ArrowRight, Crown, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

export default async function MemberDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [hasPro, programsRes, blogRes] = await Promise.all([
    getHasActivePro(supabase, user.id),
    supabase
      .from("programs")
      .select("slug, title, description, cover_image_url, price, duration_weeks")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("blog_posts")
      .select("slug, title, excerpt, published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  const programs = programsRes.data ?? [];
  const posts = blogRes.data ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Your training hub — programs, updates, and membership.</p>
      </div>

      {!hasPro && (
        <section className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50 via-white to-lime-50 p-6 shadow-sm sm:p-8">
          <div className="relative z-1 max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
              <Crown className="h-3.5 w-3.5" />
              Pro membership
            </div>
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">Unlock every program</h2>
            <p className="mt-2 text-sm text-zinc-700 sm:text-base">
              Upgrade to <strong>Pro</strong> for full access to all courses on the platform while your subscription
              is active — plus priority updates as we ship new programs.
            </p>
            <Link
              href="/member/upgrade"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              View Pro plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#ccff00]/30 blur-2xl"
            aria-hidden
          />
        </section>
      )}

      {hasPro && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          <Crown className="h-5 w-5 shrink-0 text-emerald-700" />
          <p>
            <span className="font-semibold">Pro is active.</span> You have access to all published programs.
          </p>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Latest programs</h2>
            <p className="text-sm text-zinc-500">Recently updated on the platform</p>
          </div>
          <Link href="/member/programs" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            Browse all
          </Link>
        </div>
        {programsRes.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load programs.
          </p>
        )}
        {!programsRes.error && programs.length === 0 && (
          <p className="text-sm text-zinc-500">No published programs yet.</p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => {
            const slug = p.slug?.trim();
            if (!slug) return null;
            const img = p.cover_image_url?.trim() || COVER_FALLBACK;
            return (
              <li key={slug}>
                <Link
                  href={`/programs/${slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-800">{p.title}</h3>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{p.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500">
                      {p.price != null && <span>{Number(p.price).toFixed(0)} €</span>}
                      {p.duration_weeks != null && <span>{p.duration_weeks} wk</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-zinc-400" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">From the blog</h2>
              <p className="text-sm text-zinc-500">Latest articles</p>
            </div>
          </div>
          <Link href="/blog" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            All posts
          </Link>
        </div>
        {blogRes.error && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Blog could not be loaded. Run the latest database migration if <code className="font-mono">blog_posts</code>{" "}
            is missing.
          </p>
        )}
        {!blogRes.error && posts.length === 0 && (
          <p className="text-sm text-zinc-500">No posts published yet.</p>
        )}
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </p>
                <h3 className="mt-1 font-semibold text-zinc-900">{post.title}</h3>
                {post.excerpt && <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{post.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
