import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
};

export default async function BlogIndexPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, published_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-zinc-900">
            CORE<span className="text-emerald-600">PADEL</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/programs" className="text-zinc-600 hover:text-zinc-900">
              Programs
            </Link>
            <Link href="/member" className="text-emerald-700 hover:text-emerald-800">
              Member area
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-zinc-600">Training ideas, recovery, and padel performance.</p>

        {error && (
          <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load posts. Apply migration <code className="font-mono">20260325160000_blog_posts</code> if this
            is a fresh project.
          </p>
        )}

        {!error && (!posts || posts.length === 0) && (
          <p className="mt-8 text-sm text-zinc-500">No published posts yet.</p>
        )}

        <ul className="mt-10 space-y-8">
          {(posts ?? []).map((post) => (
            <li key={post.slug}>
              <article>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  <Link href={`/blog/${post.slug}`} className="hover:text-emerald-800">
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && <p className="mt-2 text-zinc-600">{post.excerpt}</p>}
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Read more →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
