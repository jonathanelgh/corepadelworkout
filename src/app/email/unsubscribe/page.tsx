import Link from "next/link";
import { stopProConversionNurtureByToken } from "@/lib/emails/pro-conversion-nurture";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function EmailUnsubscribePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";

  let message = "Missing unsubscribe token.";
  let ok = false;

  if (token) {
    const result = await stopProConversionNurtureByToken(token);
    if (result.ok) {
      ok = true;
      message = "You are unsubscribed from Pro upgrade emails.";
    } else {
      message = result.error;
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-16 text-zinc-900">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">
          Core Padel Workout
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {ok ? "Unsubscribed" : "Unsubscribe"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{message}</p>
        <p className="mt-6 text-sm text-zinc-500">
          Your account stays active. You can still upgrade anytime from your dashboard.
        </p>
        <Link
          href="/member"
          className="mt-8 inline-flex rounded-xl bg-[#ccff00] px-5 py-3 text-sm font-bold text-zinc-900"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
