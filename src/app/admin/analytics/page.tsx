import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  Dumbbell,
  Flame,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAdminAnalyticsData } from "@/lib/admin/load-admin-analytics-data";

export const dynamic = "force-dynamic";

const kpiIcons = [Users, Dumbbell, Flame, Activity] as const;

function formatWhen(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFormat(format: string): string {
  if (format === "single_workout") return "Single workout";
  return "Program";
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/analytics");
  }

  const data = await loadAdminAnalyticsData(supabase);
  const maxDay = Math.max(
    1,
    ...data.activityByDay.map((d) => d.completed + d.started)
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-gray-700" />
          <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
        </div>
        <p className="hidden text-sm text-gray-500 sm:block">
          Program starts, workout completions, and member activity
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {data.loadError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Some analytics data could not be loaded: {data.loadError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.kpis.map((kpi, index) => {
              const Icon = kpiIcons[index] ?? Activity;
              return (
                <div key={kpi.title} className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                    {kpi.hint ? (
                      <span className="max-w-[60%] text-right text-xs font-medium text-gray-500">
                        {kpi.hint}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-gray-500">{kpi.title}</h3>
                  <div className="text-3xl font-bold tracking-tight text-gray-900">{kpi.value}</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activity (last 28 days)</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Completed workouts in lime · started (in progress) in gray
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#ccff00]" /> Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" /> Started
                </span>
              </div>
            </div>
            <div className="flex h-48 items-end gap-1.5 overflow-x-auto pb-1">
              {data.activityByDay.map((day) => {
                const total = day.completed + day.started;
                const heightPct = Math.max(total > 0 ? 8 : 2, Math.round((total / maxDay) * 100));
                const completedShare =
                  total > 0 ? Math.round((day.completed / total) * 100) : 0;
                return (
                  <div
                    key={day.dateKey}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                    title={`${day.label}: ${day.completed} completed, ${day.started} started`}
                  >
                    <div className="flex h-36 w-full max-w-8 items-end justify-center">
                      <div
                        className="flex w-full max-w-7 flex-col justify-end overflow-hidden rounded-t-md bg-gray-100"
                        style={{ height: `${heightPct}%` }}
                      >
                        {day.started > 0 ? (
                          <div
                            className="w-full bg-gray-300"
                            style={{
                              height: `${100 - completedShare}%`,
                              minHeight: day.started > 0 ? 2 : 0,
                            }}
                          />
                        ) : null}
                        {day.completed > 0 ? (
                          <div
                            className="w-full bg-[#ccff00]"
                            style={{
                              height: `${completedShare}%`,
                              minHeight: day.completed > 0 ? 2 : 0,
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                    <span className="truncate text-[10px] text-gray-400 group-hover:text-gray-700">
                      {day.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white xl:col-span-3">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Programs</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Who entered each program and how much training happened
                  </p>
                </div>
                <Link
                  href="/admin/programs"
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
                >
                  Manage
                </Link>
              </div>
              {data.programs.length === 0 ? (
                <p className="px-6 py-10 text-sm text-gray-500">No program activity yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        <th className="px-6 py-3 font-semibold">Program</th>
                        <th className="px-4 py-3 font-semibold">People in</th>
                        <th className="px-4 py-3 font-semibold">Enrolled</th>
                        <th className="px-4 py-3 font-semibold">Completed</th>
                        <th className="px-4 py-3 font-semibold">In progress</th>
                        <th className="px-6 py-3 font-semibold">Finishers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.programs.map((row) => (
                        <tr key={row.programId} className="border-b border-gray-100 last:border-0">
                          <td className="px-6 py-3.5">
                            <div className="font-medium text-gray-900">{row.title}</div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {formatFormat(row.format)}
                              {row.status !== "published" ? ` · ${row.status}` : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 tabular-nums text-gray-900">{row.runners}</td>
                          <td className="px-4 py-3.5 tabular-nums text-gray-600">{row.enrollments}</td>
                          <td className="px-4 py-3.5 tabular-nums font-medium text-gray-900">
                            {row.workoutsCompleted}
                          </td>
                          <td className="px-4 py-3.5 tabular-nums text-gray-600">
                            {row.workoutsStarted}
                          </td>
                          <td className="px-6 py-3.5 tabular-nums text-gray-600">
                            {row.uniqueCompleters}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white xl:col-span-2">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">Top members this month</h2>
                <p className="mt-0.5 text-sm text-gray-500">Most workout days completed</p>
              </div>
              {data.topMembersThisMonth.length === 0 ? (
                <p className="px-6 py-10 text-sm text-gray-500">No completions this month yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.topMembersThisMonth.map((m, i) => (
                    <li key={m.userId} className="flex items-center gap-3 px-6 py-3.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="truncate text-xs text-gray-500">{m.email}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-gray-900">
                          {m.completed}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {m.started > 0 ? `${m.started} open` : "completed"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Recent completions</h2>
              <p className="mt-0.5 text-sm text-gray-500">Latest finished workout days across the platform</p>
            </div>
            {data.recentCompletions.length === 0 ? (
              <p className="px-6 py-10 text-sm text-gray-500">No completed workouts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      <th className="px-6 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">Program</th>
                      <th className="px-4 py-3 font-semibold">Session</th>
                      <th className="px-6 py-3 font-semibold">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentCompletions.map((row, idx) => (
                      <tr
                        key={`${row.userEmail}-${row.completedAt}-${idx}`}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-gray-900">{row.userName}</div>
                          <div className="text-xs text-gray-500">{row.userEmail}</div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{row.programTitle}</td>
                        <td className="px-4 py-3.5 text-gray-700">{row.sessionName}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-gray-500">
                          {formatWhen(row.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
