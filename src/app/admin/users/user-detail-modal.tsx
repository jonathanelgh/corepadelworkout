"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import type { AdminUserDetail } from "@/lib/admin/load-admin-user-detail";
import {
  formatDateOfBirth,
  formatTrainingDuration,
  formatTrainingTimestamp,
} from "@/lib/admin/load-admin-user-detail";
import {
  ADMIN_PRO_GRANT_MONTHS,
  type AdminProGrantMonths,
} from "@/lib/admin/manage-pro-subscription";
import { getAdminUserDetail, grantAdminUserPro, revokeAdminUserPro } from "./actions";
import type { AdminUserRow } from "./users-list-client";

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

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function UserDetailContent({
  detail,
  onDetailChange,
}: {
  detail: AdminUserDetail;
  onDetailChange: (detail: AdminUserDetail) => void;
}) {
  const label = detail.fullName?.trim() || detail.email || "Unknown";
  const img = detail.profileImageUrl?.trim();
  const onboarded = Boolean(detail.onboardingCompletedAt);
  const [grantMonths, setGrantMonths] = useState<AdminProGrantMonths>(12);
  const [proAction, setProAction] = useState<"grant" | "revoke" | null>(null);
  const [proError, setProError] = useState<string | null>(null);
  const [proMessage, setProMessage] = useState<string | null>(null);

  async function handleGrantPro() {
    setProAction("grant");
    setProError(null);
    setProMessage(null);
    const res = await grantAdminUserPro(detail.id, grantMonths);
    setProAction(null);
    if ("error" in res) {
      setProError(res.error);
      return;
    }
    onDetailChange(res.detail);
    setProMessage(
      res.detail.subscription.hasActivePro
        ? `Pro access updated through ${formatJoined(res.detail.subscription.currentPeriodEnd!)}.`
        : "Pro access granted."
    );
  }

  async function handleRevokePro() {
    if (
      !window.confirm(
        "Revoke this user's manual Pro access? Stripe-managed subscriptions must be canceled in Stripe."
      )
    ) {
      return;
    }
    setProAction("revoke");
    setProError(null);
    setProMessage(null);
    const res = await revokeAdminUserPro(detail.id);
    setProAction(null);
    if ("error" in res) {
      setProError(res.error);
      return;
    }
    onDetailChange(res.detail);
    setProMessage("Manual Pro access revoked.");
  }

  const canRevokeManualPro =
    detail.subscription.hasActivePro &&
    !detail.isAdmin &&
    !detail.subscription.isStripeManaged;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-gray-100 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg font-semibold text-gray-600">
            {initials(detail.fullName, detail.email)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
            {detail.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-100 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </span>
            )}
          </div>
          {detail.email && <p className="truncate text-sm text-gray-500">{detail.email}</p>}
          <p className="mt-1 font-mono text-xs text-gray-400">{detail.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
          <p className="text-xs font-medium text-gray-500">Programs started</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
            {detail.stats.programsStarted}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
          <p className="text-xs font-medium text-gray-500">Workouts completed</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
            {detail.stats.workoutsCompleted}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
          <p className="text-xs font-medium text-gray-500">In progress</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
            {detail.stats.workoutsInProgress}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
          <p className="text-xs font-medium text-gray-500">Last activity</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {detail.stats.lastActivityAt
              ? formatTrainingTimestamp(detail.stats.lastActivityAt)
              : "—"}
          </p>
        </div>
      </div>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <User className="h-4 w-4 text-gray-500" />
          Profile
        </h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <DetailField label="Joined" value={formatJoined(detail.createdAt)} />
          <DetailField
            label="Onboarding"
            value={onboarded ? "Complete" : "Incomplete"}
          />
          <DetailField
            label="Age"
            value={
              detail.age != null
                ? `${detail.age}${detail.dateOfBirth ? ` (${formatDateOfBirth(detail.dateOfBirth)})` : ""}`
                : null
            }
          />
          <DetailField label="Gender" value={detail.gender} />
          <DetailField label="Padel level" value={detail.padelLevelName} />
          <DetailField label="Primary goal" value={detail.goalLabel} />
          <DetailField label="Training environment" value={detail.envLabel} />
          <DetailField label="Pain / focus areas" value={detail.painsStr} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Target className="h-4 w-4 text-gray-500" />
          Access
        </h4>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Subscription</p>
            <p className="mt-0.5 text-sm text-gray-900">
              {detail.subscription.hasActivePro
                ? detail.subscription.planName ?? "Pro"
                : "No active subscription"}
              {detail.subscription.status && detail.subscription.hasActivePro && (
                <span className="text-gray-500"> · {detail.subscription.status}</span>
              )}
            </p>
            {detail.subscription.currentPeriodEnd && (
              <p className="mt-0.5 text-xs text-gray-500">
                Renews / ends {formatJoined(detail.subscription.currentPeriodEnd)}
                {detail.subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
              </p>
            )}
            {detail.subscription.hasActivePro && detail.subscription.isStripeManaged && (
              <p className="mt-0.5 text-xs text-gray-500">Managed by Stripe billing</p>
            )}
            {detail.subscription.hasActivePro && !detail.subscription.isStripeManaged && !detail.isAdmin && (
              <p className="mt-0.5 text-xs text-gray-500">Manual / comp access</p>
            )}
            {detail.isAdmin && (
              <p className="mt-0.5 text-xs text-gray-500">Admin accounts always have Pro access.</p>
            )}
          </div>
          {!detail.isAdmin && (
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
              <p className="text-xs font-medium text-gray-500">Manual Pro access</p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-gray-600">
                  Duration
                  <select
                    value={grantMonths}
                    onChange={(e) => setGrantMonths(Number(e.target.value) as AdminProGrantMonths)}
                    disabled={proAction !== null}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {ADMIN_PRO_GRANT_MONTHS.map((months) => (
                      <option key={months} value={months}>
                        {months} month{months === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void handleGrantPro()}
                  disabled={proAction !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {proAction === "grant" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {detail.subscription.hasActivePro ? "Extend Pro" : "Grant Pro"}
                </button>
                {canRevokeManualPro && (
                  <button
                    type="button"
                    onClick={() => void handleRevokePro()}
                    disabled={proAction !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {proAction === "revoke" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Revoke Pro
                  </button>
                )}
              </div>
              {proError && (
                <p className="text-sm text-red-700">{proError}</p>
              )}
              {proMessage && (
                <p className="text-sm text-emerald-700">{proMessage}</p>
              )}
            </div>
          )}
          {detail.enrollments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500">Purchased programs</p>
              <ul className="mt-2 space-y-1.5">
                {detail.enrollments.map((e) => (
                  <li key={e.programId} className="flex items-center justify-between gap-2 text-sm">
                    <Link
                      href={`/admin/programs/${e.programId}/edit`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {e.title}
                    </Link>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatJoined(e.enrolledAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detail.enrollments.length === 0 && !detail.subscription.hasActivePro && (
            <p className="text-sm text-gray-500">No program purchases or active Pro plan.</p>
          )}
        </div>
      </section>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Activity className="h-4 w-4 text-gray-500" />
          Started programs
        </h4>
        {detail.activePrograms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            No active program runs yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {detail.activePrograms.map((prog) => {
              const pct =
                prog.totalSessions > 0
                  ? Math.round((prog.completedCount / prog.totalSessions) * 100)
                  : 0;
              return (
                <li
                  key={prog.programId}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/programs/${prog.programId}/edit`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {prog.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Started{" "}
                        {prog.startedAt ? formatTrainingTimestamp(prog.startedAt) : "—"}
                      </p>
                    </div>
                    {prog.isComplete ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Complete
                      </span>
                    ) : (
                      <span className="shrink-0 text-sm font-medium tabular-nums text-gray-600">
                        {prog.completedCount}/{prog.totalSessions}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-black transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {prog.nextSessionName && !prog.isComplete && (
                    <p className="mt-2 text-xs text-gray-500">Next: {prog.nextSessionName}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Calendar className="h-4 w-4 text-gray-500" />
          Workout log
        </h4>
        {detail.workoutLog.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            No workouts logged yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {detail.workoutLog.map((entry, i) => {
              const inProgress = Boolean(entry.startedAt && !entry.completedAt);
              const duration =
                entry.startedAt && entry.completedAt
                  ? formatTrainingDuration(entry.startedAt, entry.completedAt)
                  : null;
              const key = `${entry.programId}-${entry.sessionLabel}-${entry.completedAt ?? entry.startedAt ?? i}`;

              return (
                <li
                  key={key}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{entry.sessionLabel}</p>
                      <p className="text-sm text-gray-600">{entry.programTitle}</p>
                      {entry.programFormat === "single_workout" && (
                        <span className="mt-1 inline-block text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                          Single workout
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {inProgress && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          In progress
                        </span>
                      )}
                      {entry.completedAt && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    {(entry.completedAt ?? entry.startedAt) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {formatTrainingTimestamp(entry.completedAt ?? entry.startedAt!)}
                        </span>
                        {duration && <span className="text-gray-400">· {duration}</span>}
                      </div>
                    )}
                  </dl>
                  <Link
                    href={`/admin/programs/${entry.programId}/edit`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
                  >
                    View program
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function UserDetailModal({
  user,
  onClose,
}: {
  user: AdminUserRow;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    void getAdminUserDetail(user.id).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setDetail(res.detail);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  if (!mounted) return null;

  const label = user.fullName?.trim() || user.email || "User";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={() => !loading && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(92vh,800px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Loading client details…</p>
            </div>
          )}
          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {detail && !loading && (
            <UserDetailContent
              detail={detail}
              onDetailChange={(next) => setDetail(next)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
