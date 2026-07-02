"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Dumbbell,
  Home,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { tabToHref, type MemberTab } from "@/lib/member/member-tabs";
import type { MemberHubData } from "@/lib/member/load-member-hub-data";
import { MemberHomeTab } from "@/components/member/member-home-tab";
import { MemberCustomTab } from "@/components/member/member-custom-tab";
import { MemberProfileTab } from "@/components/member/member-profile-tab";
import { MemberProgramsLibraryClient } from "@/app/member/(shell)/programs/member-programs-client";

type Profile = {
  full_name: string | null;
  email: string | null;
  profile_image_url: string | null;
} | null;

const desktopNav: { tab: MemberTab; label: string; icon: typeof Home }[] = [
  { tab: "home", label: "Dashboard", icon: LayoutDashboard },
  { tab: "workouts", label: "Programs", icon: Dumbbell },
  { tab: "custom", label: "Custom", icon: Sparkles },
  { tab: "profile", label: "Profile", icon: User },
];

const mobileTabs: { tab: MemberTab; label: string; icon: typeof Home }[] = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "workouts", label: "Workouts", icon: Dumbbell },
  { tab: "custom", label: "Coach", icon: Sparkles },
  { tab: "profile", label: "Profile", icon: User },
];

function panelStyle(visible: boolean): React.CSSProperties {
  return { display: visible ? "block" : "none" };
}

export function MemberAppShell({
  userEmail,
  profile,
  children,
  hubData,
  initialTab = "home",
  billingSuccess,
  promoCode,
}: {
  userEmail: string | null;
  profile: Profile;
  children?: React.ReactNode;
  hubData?: MemberHubData;
  initialTab?: MemberTab;
  billingSuccess?: boolean;
  promoCode?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isHub = Boolean(hubData);
  const [tab, setTab] = useState<MemberTab>(initialTab);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = profile?.full_name?.trim() || userEmail?.split("@")[0] || "Member";
  const uploaded = profile?.profile_image_url?.trim();
  const isCoachTab = Boolean(isHub && tab === "custom" && hubData?.hasActivePro);

  function selectTab(next: MemberTab) {
    if (isHub) {
      setTab(next);
      return;
    }
    router.push(tabToHref(next));
  }

  function isTabActive(item: MemberTab): boolean {
    if (isHub) return tab === item;
    if (item === "home") return pathname === "/member" || pathname === "/member/upgrade";
    if (item === "workouts") return pathname.startsWith("/member/programs");
    if (item === "custom") return pathname.startsWith("/member/custom");
    if (item === "profile") return pathname.startsWith("/member/profile");
    return false;
  }

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className={`flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 ${
        isCoachTab ? "max-md:h-dvh max-md:overflow-hidden" : ""
      }`}
    >
      <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-12">
          {isCoachTab && (
            <div className="absolute inset-x-4 flex items-center justify-between md:hidden">
              <button
                type="button"
                onClick={() => selectTab("home")}
                className="flex items-center gap-1.5 rounded-lg py-2 text-sm font-medium text-zinc-700 transition hover:text-zinc-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              <div className="pointer-events-none absolute inset-x-0 flex justify-center">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">AI Coach</span>
                </div>
              </div>
              <div className="w-18" aria-hidden />
            </div>
          )}

          <button
            type="button"
            onClick={() => selectTab("home")}
            className={`shrink-0 font-bold tracking-tight text-zinc-900 ${isCoachTab ? "hidden md:block" : ""}`}
          >
            CORE<span className="text-emerald-600">PADEL</span>
            <span className="ml-2 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Member
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Member">
            {desktopNav.map(({ tab: item, label, icon: Icon }) => {
              const active = isTabActive(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectTab(item)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4 opacity-80" />
                  {label}
                </button>
              );
            })}
            <Link
              href="/blog"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <BookOpen className="h-4 w-4 opacity-80" />
              Blog
            </Link>
          </nav>

          <div className={`relative shrink-0 ${isCoachTab ? "max-md:hidden" : ""}`}>
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
                  <div className="md:hidden py-1">
                    <Link
                      href="/blog"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      <BookOpen className="h-4 w-4" />
                      Blog
                    </Link>
                  </div>
                  {!isHub && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        selectTab("profile");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                      role="menuitem"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                  )}
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

      <main
        className={`mx-auto flex w-full max-w-[1400px] flex-1 flex-col min-h-0 ${
          isCoachTab
            ? "max-md:overflow-hidden max-md:px-0 max-md:py-0 max-md:pb-0 md:px-12 md:py-8 md:pb-8"
            : "px-6 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-12 md:pb-8"
        }`}
      >
        {isHub && hubData ? (
          <>
            <div style={panelStyle(tab === "home")} aria-hidden={tab !== "home"}>
              <MemberHomeTab
                hasActivePro={hubData.hasActivePro}
                subscription={hubData.subscription}
                activePrograms={hubData.activePrograms}
                quickWorkouts={hubData.quickWorkouts}
                programs={hubData.homePrograms}
                programsError={hubData.homeProgramsError}
                posts={hubData.blogPosts}
                postsError={hubData.blogPostsError}
                onBrowseWorkouts={() => setTab("workouts")}
              />
            </div>
            <div style={panelStyle(tab === "workouts")} aria-hidden={tab !== "workouts"}>
              <MemberProgramsLibraryClient
                allPrograms={hubData.allPrograms}
                myPrograms={hubData.myPrograms}
                categoryOptionsAll={hubData.categoryOptionsAll}
                hasActivePro={hubData.hasActivePro}
                loadErrorAll={hubData.workoutsErrorAll}
                loadErrorMy={hubData.workoutsErrorMy}
              />
            </div>
            <div
              style={panelStyle(tab === "custom")}
              aria-hidden={tab !== "custom"}
              className={isCoachTab ? "max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col" : undefined}
            >
              <MemberCustomTab hasActivePro={hubData.hasActivePro} mobileFullscreen={isCoachTab} />
            </div>
            <div style={panelStyle(tab === "profile")} aria-hidden={tab !== "profile"}>
              <MemberProfileTab
                profile={hubData.profileDetails}
                subscription={hubData.subscription}
                billingSuccess={billingSuccess}
                promoCode={promoCode}
              />
            </div>
          </>
        ) : (
          children
        )}
      </main>

      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md md:hidden ${
          isCoachTab ? "max-md:hidden" : ""
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Member mobile"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
          {mobileTabs.map(({ tab: item, label, icon: Icon }) => {
            const active = isTabActive(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => selectTab(item)}
                className={`flex min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors ${
                  active ? "text-emerald-700" : "text-zinc-500 hover:text-zinc-800"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-emerald-600" : "text-zinc-400"}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
