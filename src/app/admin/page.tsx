import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  TrendingUp,
  Activity,
  CreditCard,
  ArrowRight,
  Dumbbell,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAdminDashboardData } from "@/lib/admin/load-admin-dashboard-data";

export const dynamic = "force-dynamic";

const statIcons = [Users, CreditCard, TrendingUp, Activity] as const;

export default async function AdminDashboard() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin");
  }

  const { stats, recentSignups, loadError } = await loadAdminDashboardData(supabase);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard Overview</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {loadError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Some dashboard data could not be loaded: {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = statIcons[index] ?? Activity;
              return (
                <div key={stat.title} className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                    {stat.hint && (
                      <span className="max-w-[55%] text-right text-xs font-medium text-gray-500">
                        {stat.hint}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-gray-500">{stat.title}</h3>
                  <div className="text-3xl font-bold tracking-tight text-gray-900">{stat.value}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white lg:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent signups</h2>
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
                >
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                {recentSignups.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-gray-500">No members yet.</p>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 text-sm text-gray-500">
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Access</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {recentSignups.map((user) => (
                        <tr key={user.id} className="transition-colors hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{user.plan}</td>
                          <td className="px-6 py-4 text-gray-500">{user.joinedLabel}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${
                                user.status === "Active"
                                  ? "border-green-100 bg-green-50 text-green-700"
                                  : user.status === "Lead"
                                    ? "border-blue-100 bg-blue-50 text-blue-700"
                                    : "border-gray-200 bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href="/admin/users"
                              className="inline-flex p-1 text-gray-400 transition-colors hover:text-black"
                              title="View users"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Quick actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/programs/new"
                  className="group flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ccff00]/20 text-black transition-colors group-hover:bg-[#ccff00]">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900">Add new program</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black" />
                </Link>
                <Link
                  href="/admin/users"
                  className="group flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-black transition-colors group-hover:bg-black group-hover:text-white">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900">Manage members</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black" />
                </Link>
                <Link
                  href="/admin/programs"
                  className="group flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-black transition-colors group-hover:bg-black group-hover:text-white">
                      <Activity className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900">View programs</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
