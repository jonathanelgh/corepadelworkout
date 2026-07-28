import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import {
  normalizeAdminProgramFields,
  saveAdminProgram,
} from "@/lib/programs/save-admin-program";
import type { TrackPayload } from "@/lib/programs/program-curriculum";

export const maxDuration = 120;

type SaveBody = {
  programId?: string | null;
  fields?: Record<string, unknown>;
  tracks?: TrackPayload[];
  outcomes?: unknown;
};

function parseOutcomes(raw: unknown): string[] | { error: string } {
  if (!Array.isArray(raw)) return { error: "Invalid outcomes." };
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (t) out.push(t);
  }
  if (out.length > 50) return { error: "At most 50 outcome lines are allowed." };
  for (const s of out) {
    if (s.length > 500) return { error: "Each outcome line must be at most 500 characters." };
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in (open /login)." }, { status: 401 });
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

    const fields = normalizeAdminProgramFields(body.fields ?? {});
    if ("error" in fields) {
      return NextResponse.json({ error: fields.error }, { status: 400 });
    }

    const outcomes = parseOutcomes(body.outcomes ?? []);
    if ("error" in outcomes) {
      return NextResponse.json({ error: outcomes.error }, { status: 400 });
    }

    const tracks = Array.isArray(body.tracks) ? body.tracks : [];

    const result = await saveAdminProgram(supabase, {
      programId: body.programId,
      fields,
      tracks,
      outcomes,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      programId: result.programId,
      slug: result.slug,
      status: fields.status,
    });
  } catch (e) {
    console.error("[api/admin/programs/save]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save program." },
      { status: 500 }
    );
  }
}
