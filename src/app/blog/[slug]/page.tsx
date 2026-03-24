import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PostBody } from "@/lib/blog/format-post-body";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return { title: "Post" };
  return {
    title: data.title,
    description: data.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, body, published_at, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/blog" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Blog
          </Link>
          <Link href="/member" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Member area
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg text-zinc-600">{post.excerpt}</p>}

        {post.cover_image_url?.trim() && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url.trim()} alt="" className="w-full object-cover" />
          </div>
        )}

        <div className="prose prose-zinc mt-10 max-w-none">
          <PostBody text={post.body} />
        </div>
      </article>
    </div>
  );
}
