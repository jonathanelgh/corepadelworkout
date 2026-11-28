"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { createClient } from "@/utils/supabase/client";

const links = [
  { href: "/affiliate", label: "Overview" },
  { href: "/affiliate/sales", label: "Sales" },
  { href: "/affiliate/discounts", label: "Discounts" },
  { href: "/affiliate/analytics", label: "Analytics" },
  { href: "/affiliate/payouts", label: "Payouts" },
  { href: "/affiliate/settings", label: "Settings" },
];

export function AffiliateShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-900 bg-zinc-950 text-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/affiliate" className="inline-flex items-center gap-2">
            <BrandWordmark tone="onDark" />
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
              Affiliate
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-zinc-300 sm:inline">{name}</span>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="text-zinc-300 hover:text-white disabled:opacity-60"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:flex-row md:py-8">
        <nav className="flex gap-2 overflow-x-auto md:w-44 md:flex-col">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm whitespace-nowrap ${
                  active ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
