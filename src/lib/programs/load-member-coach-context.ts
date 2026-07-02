import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildProgramTrainingLog,
  formatTrainingDuration,
  formatTrainingTimestamp,
  loadProgramProgress,
  loadUserActivePrograms,
} from "@/lib/programs/program-progress";

type ProfileEnv = {
  training_environment: string | null;
  training_environments: string[] | null;
};

type RecentLogRow = {
  started_at: string | null;
  completed_at: string | null;
  programs: { title: string; program_format: string | null } | { title: string; program_format: string | null }[] | null;
  program_sessions: { name: string } | { name: string }[] | null;
};

function relTitle(
  rel: { title: string } | { title: string }[] | null | undefined
): string | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0]?.title ?? null;
  return rel.title;
}

function relSessionName(
  rel: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0]?.name ?? null;
  return rel.name;
}

/** Active programs, enrollments, and recent session log for the member AI coach. */
export async function loadMemberCoachTrainingContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("training_environment, training_environments")
    .eq("id", userId)
    .maybeSingle();

  const profile: ProfileEnv | null = profileRow
    ? {
        training_environment: profileRow.training_environment as string | null,
        training_environments: (profileRow.training_environments as string[] | null) ?? null,
      }
    : null;

  const lines: string[] = [];

  const activePrograms = await loadUserActivePrograms(supabase, userId, profile);
  if (activePrograms.length > 0) {
    lines.push("### Active training programs");
    for (const p of activePrograms) {
      const progress = `${p.completedCount}/${p.totalSessions} sessions complete`;
      const next = p.nextSessionName ? ` · next: ${p.nextSessionName}` : "";
      const status = p.isComplete ? " · program complete" : "";
      lines.push(`- **${p.title}** — ${progress}${next}${status}`);
    }
  } else {
    lines.push("### Active training programs\n- None in progress right now.");
  }

  const { data: enrollRows } = await supabase
    .from("program_enrollments")
    .select("programs ( title, program_format )")
    .eq("user_id", userId)
    .eq("status", "active");

  const enrolledTitles = (enrollRows ?? [])
    .map((row) => {
      const title = relTitle(row.programs as RecentLogRow["programs"]);
      const format = Array.isArray(row.programs)
        ? (row.programs[0] as { program_format?: string } | undefined)?.program_format
        : (row.programs as { program_format?: string } | null)?.program_format;
      if (!title || format === "single_workout") return null;
      return title;
    })
    .filter(Boolean) as string[];

  if (enrolledTitles.length > 0) {
    lines.push("", "### Enrolled programs (library)");
    for (const title of [...new Set(enrolledTitles)].slice(0, 8)) {
      lines.push(`- ${title}`);
    }
  }

  const { data: recentLogs } = await supabase
    .from("program_session_completions")
    .select(
      `
      started_at,
      completed_at,
      programs ( title, program_format ),
      program_sessions ( name )
    `
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false })
    .limit(12);

  const logLines: string[] = [];
  for (const row of (recentLogs ?? []) as RecentLogRow[]) {
    const programTitle = relTitle(row.programs);
    const sessionName = relSessionName(row.program_sessions);
    if (!programTitle) continue;
    const when = row.completed_at ?? row.started_at;
    if (!when) continue;
    const label = sessionName ? `${programTitle} — ${sessionName}` : programTitle;
    const state = row.completed_at ? "completed" : "started (in progress)";
    const duration =
      row.started_at && row.completed_at
        ? formatTrainingDuration(row.started_at, row.completed_at)
        : null;
    const extra = duration ? ` · ${duration}` : "";
    logLines.push(
      `- ${label} (${state} ${formatTrainingTimestamp(when)}${extra})`
    );
  }

  if (logLines.length > 0) {
    lines.push("", "### Recent workout log (newest first)");
    lines.push(...logLines);
  } else {
    lines.push("", "### Recent workout log\n- No logged sessions yet.");
  }

  for (const active of activePrograms.slice(0, 3)) {
    const progress = await loadProgramProgress(
      supabase,
      userId,
      active.programId,
      profile,
      "training_plan"
    );
    if (!progress) continue;
    const log = buildProgramTrainingLog(progress).slice(0, 4);
    if (log.length === 0) continue;
    lines.push("", `### Session detail — ${active.title}`);
    for (const entry of log) {
      const when = entry.completedAt ?? entry.startedAt;
      if (!when) continue;
      const duration =
        entry.startedAt && entry.completedAt
          ? formatTrainingDuration(entry.startedAt, entry.completedAt)
          : null;
      lines.push(
        `- ${entry.label}${entry.weekName ? ` (${entry.weekName})` : ""}: ${entry.completedAt ? "done" : "started"} ${formatTrainingTimestamp(when)}${duration ? ` · ${duration}` : ""}`
      );
    }
  }

  return lines.join("\n");
}

export function memberTrainingContextBlock(trainingContext: string | null | undefined): string {
  if (!trainingContext?.trim()) return "";
  return `\n## Training activity\n${trainingContext.trim()}\n`;
}
