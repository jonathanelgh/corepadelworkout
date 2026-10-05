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
  hasActivePro: boolean;
  isPayingPro: boolean;
  isComplimentaryPro: boolean;
  offerCodes: string[];
};

export type OfferFilterOption = {
  code: string;
  name: string;
};

export type AccessFilter =
  | "all"
  | "paying"
  | "complimentary"
  | "offer"
  | "no_pro";

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
  if (row.offerCodes.some((c) => c.toLowerCase().includes(n))) return true;
  return false;
}

function matchesAccessFilter(
  row: AdminUserRow,
  filter: AccessFilter,
  offerCode: string
): boolean {
  switch (filter) {
    case "paying":
      return row.isPayingPro;
    case "complimentary":
      return row.isComplimentaryPro;
    case "offer":
      if (row.offerCodes.length === 0) return false;
      if (!offerCode) return true;
      return row.offerCodes.includes(offerCode);
    case "no_pro":
      return !row.hasActivePro;
    case "all":
    default:
      return true;
  }
}

const FILTERS: { id: AccessFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paying", label: "Paying Pro" },
  { id: "complimentary", label: "Complimentary Pro" },
  { id: "offer", label: "Offer invite" },
  { id: "no_pro", label: "No Pro" },
];

export function UsersListClient({
  rows,
  offerOptions,
}: {
  rows: AdminUserRow[];
  offerOptions: OfferFilterOption[];
}) {
  const [query, setQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [offerCode, setOfferCode] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      paying: rows.filter((r) => r.isPayingPro).length,
      complimentary: rows.filter((r) => r.isComplimentaryPro).length,
      offer: rows.filter((r) => r.offerCodes.length > 0).length,
      no_pro: rows.filter((r) => !r.hasActivePro).length,
    } satisfies Record<AccessFilter, number>;
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          matchesQuery(r, query.trim()) && matchesAccessFilter(r, accessFilter, offerCode)
      ),
    [rows, query, accessFilter, offerCode]
  );

  return (
    <>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, offer code, or user id…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            aria-label="Search users"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = accessFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setAccessFilter(f.id);
                  if (f.id !== "offer") setOfferCode("");
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f.label}
                <span className={active ? "text-white/70" : "text-gray-400"}>{counts[f.id]}</span>
              </button>
            );
          })}

          {accessFilter === "offer" && offerOptions.length > 0 && (
            <select
              value={offerCode}
              onChange={(e) => setOfferCode(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              aria-label="Filter by offer code"
            >
              <option value="">All offer codes</option>
              {offerOptions.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code} — {o.name}
                </option>
              ))}
            </select>
          )}
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
                      <p>No matches for your search or filters.</p>
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
                      <td className="max-w-[240px] px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.isPayingPro && (
                            <span className="inline-flex rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              Paying Pro
                            </span>
                          )}
                          {user.isComplimentaryPro && (
                            <span className="inline-flex rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                              Complimentary Pro
                            </span>
                          )}
                          {user.offerCodes.map((code) => (
                            <span
                              key={code}
                              className="inline-flex rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
                            >
                              Offer {code}
                            </span>
                          ))}
                          {!user.hasActivePro && user.offerCodes.length === 0 && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
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
