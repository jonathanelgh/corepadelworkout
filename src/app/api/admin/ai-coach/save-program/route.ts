import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { saveAiProgram } from "@/lib/programs/save-ai-program";
import { generateProgramCoverImage } from "@/lib/programs/generate-program-cover";
import { isOnboardingLevel } from "@/lib/programs/profile-ai-context";
import type { ProgramProposal } from "@/lib/programs/ai-coach-gemini";
import { revalidatePath } from "next/cache";

export const maxDuration = 120;

type SaveBody = {
  proposal: ProgramProposal;
  publish?: boolean;
  generateCover?: boolean;
  trainingLevel?: string | null;
};

function slimProposal(proposal: ProgramProposal): ProgramProposal {
  return {
    title: proposal.title,
    description: proposal.description,
    body: proposal.body,
    duration_weeks: Math.max(8, Math.floor(proposal.duration_weeks || 8)),
    sessions_per_week: Math.max(1, Math.floor(proposal.sessions_per_week || 3)),
    minutes_per_session: proposal.minutes_per_session,
    location_slug: proposal.location_slug,
    sessions: (proposal.sessions ?? []).map((s) => ({
      name: s.name,
      description: s.description,
      duration_minutes: s.duration_minutes,
      exercises: (s.exercises ?? []).map((ex) => ({
        exercise_id: ex.exercise_id,
        title: ex.title || ex.exercise_id,
        phase: ex.phase,
        choice_group: ex.choice_group,
        duration_seconds: ex.duration_seconds,
        duration_minutes: ex.duration_minutes,
        sets: ex.sets,
        reps: ex.reps,
        rest_between_sets_seconds: ex.rest_between_sets_seconds,
        rest_between_sides_seconds: ex.rest_between_sides_seconds,
        rest_after_seconds: ex.rest_after_seconds ?? 0,
        load_prescription: ex.load_prescription,
        note: ex.note,
      })),
    })),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }
    if (!(await getIsAdmin(supabase))) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    let body: SaveBody;
    try {
      body = (await request.json()) as SaveBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body?.proposal?.sessions?.length) {
      return NextResponse.json({ error: "Program has no sessions to save." }, { status: 400 });
    }

    const fixed = slimProposal(body.proposal);
    const trainingLevel = isOnboardingLevel(body.trainingLevel) ? body.trainingLevel : null;

    // Validate exercise IDs without loading the full AI catalog (much faster).
    const allIds = [
      ...new Set(fixed.sessions.flatMap((s) => s.exercises.map((e) => e.exercise_id))),
    ];
    const { data: publishedRows, error: pubErr } = await supabase
      .from("exercises")
      .select("id")
      .eq("status", "published")
      .in("id", allIds);
    if (pubErr) {
      return NextResponse.json({ error: pubErr.message }, { status: 500 });
    }
    const allowedExerciseIds = new Set((publishedRows ?? []).map((r) => r.id as string));
    for (const id of allIds) {
      if (!allowedExerciseIds.has(id)) {
        return NextResponse.json(
          { error: "Program includes exercises that are missing or not published. Regenerate and try again." },
          { status: 400 }
        );
      }
    }

    const saved = await saveAiProgram(supabase, fixed, {
      status: body.publish ? "published" : "draft",
      allowedExerciseIds,
      durationWeeks: fixed.duration_weeks,
      sessionsPerWeek: fixed.sessions_per_week,
      minutesPerSession: fixed.minutes_per_session,
      trainingLevel,
    });

    try {
      revalidatePath("/admin/programs");
      revalidatePath("/programs");
    } catch (e) {
      console.warn("[api/save-program] revalidate failed:", e);
    }

    const generateCover = body.generateCover !== false;
    if (generateCover) {
      void generateProgramCoverImage({
        programId: saved.programId,
        title: saved.title,
      }).then((res) => {
        if ("imageUrl" in res) {
          revalidatePath("/admin/programs");
          revalidatePath(`/admin/programs/${saved.programId}/edit`);
        }
      });
    }

    return NextResponse.json({
      ok: true,
      programId: saved.programId,
      slug: saved.slug,
      title: saved.title,
      description: saved.description,
      sessionCount: saved.sessionCount,
      coverPending: generateCover,
      status: saved.status,
    });
  } catch (e) {
    console.error("[api/save-program]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save program." },
      { status: 500 }
    );
  }
}
