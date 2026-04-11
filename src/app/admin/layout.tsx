"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  Activity,
  Package,
  Tag,
  Layers,
  Images,
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  User
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Programs", href: "/admin/programs", icon: Dumbbell },
    { name: "Exercises", href: "/admin/exercises", icon: Activity },
    { name: "Equipment", href: "/admin/exercises/equipment", icon: Package },
    { name: "Exercise tags", href: "/admin/exercises/tags", icon: Tag },
    { name: "Exercise taxonomy", href: "/admin/exercises/taxonomy", icon: Layers },
    { name: "Media", href: "/admin/media", icon: Images },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-gray-50 font-sans text-gray-900">
      {/* Top Bar */}
      <header className="z-30 flex h-12 shrink-0 items-center justify-between border-b border-gray-800 bg-black px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-bold text-lg tracking-tight text-white">
            CORE<span className="text-[#ccff00]">PADEL</span>
            <span className="ml-2 text-[10px] font-medium bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-md tracking-normal">Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-gray-900 p-1 rounded-full md:rounded-lg transition-colors border border-transparent hover:border-gray-800"
            >
              <img 
                src="https://i.pravatar.cc/150?img=11" 
                alt="Admin Profile" 
                className="w-6 h-6 rounded-full object-cover border border-gray-800"
              />
              <span className="hidden md:block text-xs font-medium text-white pr-1">Jonathan Elgh</span>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-900">Jonathan Elgh</p>
                    <p className="text-xs text-gray-500 truncate">admin@corepadel.com</p>
                  </div>
                  <Link href="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={() => void signOut()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarOpen ? "w-64" : "w-20"
          } relative z-20 flex min-h-0 shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}
        >
          {/* Collapse Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-4 top-5 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 hover:text-black text-gray-500 transition-colors z-50"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-6">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link 
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${isSidebarOpen ? "gap-3 px-3" : "justify-center"} py-2.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-gray-100 text-gray-900 font-medium" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-black" : "text-gray-400"}`} />
                  <span className={`text-sm whitespace-nowrap transition-all duration-300 ${
                    isSidebarOpen ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 hidden"
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Content Area — only descendants with overflow-auto scroll */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}