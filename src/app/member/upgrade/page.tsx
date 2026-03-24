import Link from "next/link";
import { Crown, Check } from "lucide-react";

const perks = [
  "Access to every published program while subscribed",
  "New programs included automatically",
  "Cancel any time (billing handled via Stripe when connected)",
];

export default function MemberUpgradePage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link href="/member" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Pro membership</h1>
        <p className="mt-2 text-sm text-zinc-600">
          One subscription for the full library. Connect Stripe checkout and webhooks to activate purchases in
          production.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-zinc-900">
          <Crown className="h-6 w-6 text-amber-500" />
          <span className="text-lg font-bold">Pro</span>
        </div>
        <ul className="space-y-3">
          {perks.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-zinc-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              {t}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled
          className="mt-8 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white opacity-60"
        >
          Subscribe (connect Stripe)
        </button>
        <p className="mt-3 text-center text-xs text-zinc-500">Placeholder — wire your Stripe Price / Checkout here.</p>
      </div>
    </div>
  );
}
