"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Search, Send } from "lucide-react";
import type { PreLaunchSignupRow } from "@/lib/pre-launch/early-access";
import { sendWaitlistLaunchEmail, sendWaitlistLaunchEmailBulk, sendWaitlistLaunchEmailTest } from "./actions";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WaitlistClient({ initialRows }: { initialRows: PreLaunchSignupRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testSignupId, setTestSignupId] = useState("");
  const [testPending, setTestPending] = useState(false);
  const [bulkPending, startBulk] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(q));
  }, [rows, query]);

  const unsentCount = rows.filter((r) => !r.launch_email_sent_at).length;
  const redeemedCount = rows.filter((r) => r.pro_redeemed_at).length;

  async function onSendOne(id: string, email: string) {
    if (!window.confirm(`Send launch email to ${email}?`)) return;
    setError(null);
    setMessage(null);
    setPendingId(id);
    const result = await sendWaitlistLaunchEmail(id);
    setPendingId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, launch_email_sent_at: result.sentAt } : r))
    );
    setMessage(`Launch email sent to ${email}.`);
  }

  function onSendBulk(onlyUnsent: boolean) {
    const count = onlyUnsent ? unsentCount : rows.length;
    if (count === 0) {
      setError(onlyUnsent ? "Everyone on the list has already been emailed." : "No signups to email.");
      return;
    }
    if (
      !window.confirm(
        `Send launch email to ${count} address${count === 1 ? "" : "es"}${onlyUnsent ? " (unsent only)" : ""}?`
      )
    ) {
      return;
    }
    setError(null);
    setMessage(null);
    startBulk(async () => {
      const result = await sendWaitlistLaunchEmailBulk(onlyUnsent);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
      setMessage(`Sent ${result.sent} email${result.sent === 1 ? "" : "s"}${result.failed ? `; ${result.failed} failed` : ""}.`);
    });
  }

  async function onSendTest() {
    setError(null);
    setMessage(null);
    setTestPending(true);
    const result = await sendWaitlistLaunchEmailTest({
      to: testEmail,
      signupId: testSignupId || null,
    });
    setTestPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMessage(`Test launch email sent to ${testEmail.trim()}.`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-6 overflow-y-auto p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Launch waitlist</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pre-launch signups from the marketing page. Send the go-live email with a personal Pro
              signup link.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bulkPending || unsentCount === 0}
              onClick={() => onSendBulk(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ccff00] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-50"
            >
              {bulkPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Email unsent ({unsentCount})
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-semibold tabular-nums">{rows.length}</p>
            <p className="text-sm text-gray-500">Total signups</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-semibold tabular-nums">{unsentCount}</p>
            <p className="text-sm text-gray-500">Not emailed yet</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-semibold tabular-nums">{redeemedCount}</p>
            <p className="text-sm text-gray-500">Pro claimed</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Send test email</h2>
          <p className="mt-1 text-sm text-gray-500">
            Preview the launch email at any address. Subject is prefixed with [TEST] and waitlist status
            is not updated.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="test-email" className="mb-1.5 block text-xs font-medium text-gray-600">
                Test recipient
              </label>
              <input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            {rows.length > 0 && (
              <div className="min-w-[220px] flex-1">
                <label htmlFor="test-signup" className="mb-1.5 block text-xs font-medium text-gray-600">
                  Sample signup link
                </label>
                <select
                  id="test-signup"
                  value={testSignupId}
                  onChange={(e) => setTestSignupId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                >
                  <option value="">First waitlist signup</option>
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              disabled={testPending || bulkPending || !testEmail.trim() || rows.length === 0}
              onClick={() => void onSendTest()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {testPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send test
            </button>
          </div>
          {rows.length === 0 && (
            <p className="mt-3 text-xs text-amber-700">
              You need at least one waitlist signup to generate a sample early-access link in the test email.
            </p>
          )}
        </div>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by email…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            <p className="text-sm text-gray-500 tabular-nums">
              Showing {filtered.length} of {rows.length}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6 md:px-8 md:pb-8">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Joined</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Launch email</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Pro claimed</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No waitlist signups found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatWhen(row.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {row.launch_email_sent_at ? (
                          <span className="text-emerald-700">{formatWhen(row.launch_email_sent_at)}</span>
                        ) : (
                          <span className="text-amber-700">Not sent</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {row.pro_redeemed_at ? (
                          <span className="text-emerald-700">{formatWhen(row.pro_redeemed_at)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled={pendingId === row.id || bulkPending}
                          onClick={() => void onSendOne(row.id, row.email)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          {pendingId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
                          )}
                          Send email
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
