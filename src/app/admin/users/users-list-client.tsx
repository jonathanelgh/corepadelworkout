"use client";

import { useMemo, useState } from "react";
import { Search, Shield } from "lucide-react";
import { formatDateOfBirth } from "@/lib/member/date-of-birth";
import { UserDetailModal } from "./user-detail-modal";

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  onboardingCompletedAt: string | null;
  dateOfBirth: string | null;
  age: number | null;
  padelLevelName: string | null;
  isAdmin: boolean;
  accessLabel: string;
};

function initials(name: string | null, email: string | null): string {
  const n = (name ?? "").trim();
  if (n.length > 0) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const e = (email ?? "").trim();
  if (e.length > 0) return e.slice(0, 2).toUpperCase();
  return "?";
}

function matchesQuery(row: AdminUserRow, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  if (row.email?.toLowerCase().includes(n)) return true;
  if (row.fullName?.toLowerCase().includes(n)) return true;
  if (row.id.toLowerCase().includes(n)) return true;
  return false;
}

export function UsersListClient({ rows }: { rows: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(
    () => rows.filter((r) => matchesQuery(r, query.trim())),
    [rows, query]
  );

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or user id…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            aria-label="Search users"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Age</th>
                <th className="px-6 py-4 font-medium">Padel level</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Joined</th>
                <th className="px-6 py-4 font-medium">Onboarding</th>
                <th className="px-6 py-4 font-medium">Access</th>
                <th className="px-6 py-4 font-medium text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                    {rows.length === 0 ? (
                      <p>No user profiles yet.</p>
                    ) : (
                      <p>No matches for your search.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const onboarded = Boolean(user.onboardingCompletedAt);
                  const img = user.profileImageUrl?.trim();
                  const label = user.fullName?.trim() || user.email || "Unknown";
                  return (
                    <tr
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedUser(user)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedUser(user);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full border border-gray-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600">
                              {initials(user.fullName, user.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-900">{label}</div>
                            {user.email && (
                              <div className="truncate text-gray-500">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 tabular-nums">
                        {user.age != null ? (
                          <span title={user.dateOfBirth ? formatDateOfBirth(user.dateOfBirth) : undefined}>
                            {user.age}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.padelLevelName ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 tabular-nums">
                        {joined}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${
                            onboarded
                              ? "border-green-100 bg-green-50 text-green-700"
                              : "border-amber-100 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {onboarded ? "Complete" : "Incomplete"}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-6 py-4 text-gray-600">
                        <span className="line-clamp-2" title={user.accessLabel}>
                          {user.accessLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
                            <Shield className="h-3.5 w-3.5" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 text-sm text-gray-500">
            Showing {filtered.length} of {rows.length} user{rows.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}
