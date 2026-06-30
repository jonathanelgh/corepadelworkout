import Link from "next/link";
import { SiteFooter } from "@/components/landing/site-footer";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-sm font-bold tracking-wider uppercase transition hover:text-gray-600"
          >
            Core Padel Workout
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-600 transition hover:text-black">
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 md:py-16">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-gray-500">Last updated: {lastUpdated}</p>
          <div className="mt-10 max-w-none space-y-6 text-base leading-relaxed text-gray-700 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-black [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-black [&_a]:underline">
            {children}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
