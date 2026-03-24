"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, LogOut, Sparkles, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  full_name: string | null;
  email: string | null;
  profile_image_url: string | null;
} | null;

export function MemberAppShell({
  userEmail,
  profile,
  children,
}: {
  userEmail: string | null;
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = profile?.full_name?.trim() || userEmail?.split("@")[0] || "Member";
  const uploaded = profile?.profile_image_url?.trim();

  const nav = [
    { href: "/member", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/member" },
    {
      href: "/member/programs",
      label: "Programs",
      icon: Sparkles,
      match: (p: string) => p.startsWith("/member/programs"),
    },
    { href: "/blog", label: "Blog", icon: BookOpen, match: (p: string) => p.startsWith("/blog") },
  ];

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-6 md:px-12">
          <Link href="/member" className="shrink-0 font-bold tracking-tight text-zinc-900">
            CORE<span className="text-emerald-600">PADEL</span>
            <span className="ml-2 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Member
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Member">
            {nav.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4 opacity-80" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:border-zinc-300"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {uploaded ? (
                <img src={uploaded} alt="" className="h-8 w-8 rounded-full object-cover" width={32} height={32} />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-zinc-800 sm:inline">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default bg-transparent"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                  role="menu"
                >
                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
                    {userEmail && <p className="truncate text-xs text-zinc-500">{userEmail}</p>}
                  </div>
                  <div className="sm:hidden py-1">
                    {nav.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/member/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    role="menuitem"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8 md:px-12">{children}</main>
    </div>
  );
}
