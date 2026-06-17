#!/usr/bin/env npx tsx
/**
 * Generate cover images for exercises from their video_url.
 *
 * Requires: ffmpeg on PATH, .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Usage:
 *   npm run generate-exercise-covers
 *   npm run generate-exercise-covers -- --dry-run
 *   npm run generate-exercise-covers -- --force
 *   npm run generate-exercise-covers -- --id=<exercise-uuid>
 *   npm run generate-exercise-covers -- --limit=10 --offset=0
 */

import { spawn } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const EXERCISES_BUCKET = "exercises";
const CAPTURE_AT_SECONDS = 1;

type ExerciseRow = {
  id: string;
  title: string;
  video_url: string | null;
  image_url: string | null;
};

type ResolveResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  for (const arg of argv) {
    if (arg === "--dry-run") flags.add("dry-run");
    if (arg === "--force") flags.add("force");
    if (arg.startsWith("--id=")) values.set("id", arg.slice("--id=".length));
    if (arg.startsWith("--limit=")) values.set("limit", arg.slice("--limit=".length));
    if (arg.startsWith("--offset=")) values.set("offset", arg.slice("--offset=".length));
  }
  return {
    dryRun: flags.has("dry-run"),
    force: flags.has("force"),
    id: values.get("id"),
    limit: values.has("limit") ? Number.parseInt(values.get("limit")!, 10) : null,
    offset: values.has("offset") ? Number.parseInt(values.get("offset")!, 10) : 0,
  };
}

function extractDriveFileId(url: URL): string | null {
  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  const idFromPath = fileMatch?.[1];
  const idFromQuery = url.searchParams.get("id");
  const id = idFromPath ?? idFromQuery;
  return id && /^[\w-]+$/.test(id) ? id : null;
}

/** Return a URL ffmpeg can read, or explain why we cannot process it. */
function resolveFfmpegInputUrl(raw: string): ResolveResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty video_url" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: true, url: trimmed };
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "drive.google.com" || host === "docs.google.com") {
    const id = extractDriveFileId(parsed);
    if (!id) return { ok: false, reason: "could not parse Google Drive file id" };
    return {
      ok: true,
      url: `https://drive.google.com/uc?export=download&confirm=t&id=${encodeURIComponent(id)}`,
    };
  }

  const embedOnlyHosts = new Set([
    "youtube.com",
    "m.youtube.com",
    "youtu.be",
    "vimeo.com",
    "player.vimeo.com",
    "loom.com",
    "dailymotion.com",
  ]);
  if (embedOnlyHosts.has(host)) {
    return {
      ok: false,
      reason: `${host} embed — use a direct video file URL or Supabase storage URL`,
    };
  }

  return { ok: true, url: trimmed };
}

async function ffmpegExists(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

async function captureVideoFrame(
  inputUrl: string,
  outputPath: string,
  atSeconds: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(atSeconds),
      "-i",
      inputUrl,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-y",
      outputPath,
    ];
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    console.error("Run via: npm run generate-exercise-covers  (loads .env.local automatically)");
    process.exit(1);
  }

  if (!(await ffmpegExists())) {
    console.error("ffmpeg not found on PATH. Install ffmpeg and try again.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from("exercises")
    .select("id, title, video_url, image_url")
    .order("title", { ascending: true });

  if (args.id) query = query.eq("id", args.id);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load exercises:", error.message);
    if (error.message.toLowerCase().includes("invalid api key")) {
      console.error(
        "Tip: copy the service_role key from Supabase → Project Settings → API into .env.local as SUPABASE_SERVICE_ROLE_KEY."
      );
      console.error(
        "If you have a stale key exported in your shell, run: unset SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    process.exit(1);
  }

  let rows = (data ?? []) as ExerciseRow[];
  if (args.offset > 0) rows = rows.slice(args.offset);
  if (args.limit != null && Number.isFinite(args.limit)) rows = rows.slice(0, args.limit);

  console.log(
    `Processing ${rows.length} exercise(s)${args.dryRun ? " [dry-run]" : ""}${args.force ? " [force]" : ""}…`
  );

  const summary = { updated: 0, skipped: 0, failed: 0 };

  for (const row of rows) {
    const label = `${row.title} (${row.id})`;

    if (!row.video_url?.trim()) {
      console.log(`SKIP  ${label} — no video`);
      summary.skipped += 1;
      continue;
    }

    if (row.image_url?.trim() && !args.force) {
      console.log(`SKIP  ${label} — image_url already set (use --force to replace)`);
      summary.skipped += 1;
      continue;
    }

    const resolved = resolveFfmpegInputUrl(row.video_url);
    if (!resolved.ok) {
      console.log(`SKIP  ${label} — ${resolved.reason}`);
      summary.skipped += 1;
      continue;
    }

    const tmpPath = join(tmpdir(), `exercise-cover-${row.id}-${randomUUID()}.jpg`);
    const storagePath = `${row.id}/cover.jpg`;

    try {
      console.log(`FRAME ${label}`);
      await captureVideoFrame(resolved.url, tmpPath, CAPTURE_AT_SECONDS);
      const imageBytes = await readFile(tmpPath);

      if (args.dryRun) {
        console.log(`DRY   ${label} — captured ${imageBytes.length} bytes → ${storagePath}`);
        summary.updated += 1;
        continue;
      }

      const { error: uploadErr } = await supabase.storage
        .from(EXERCISES_BUCKET)
        .upload(storagePath, imageBytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const { data: publicData } = supabase.storage.from(EXERCISES_BUCKET).getPublicUrl(storagePath);
      const imageUrl = publicData.publicUrl;

      const { error: updateErr } = await supabase
        .from("exercises")
        .update({ image_url: imageUrl })
        .eq("id", row.id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      console.log(`OK    ${label} → ${imageUrl}`);
      summary.updated += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`FAIL  ${label} — ${msg}`);
      summary.failed += 1;
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  }

  console.log("\nDone.");
  console.log(`  updated: ${summary.updated}`);
  console.log(`  skipped: ${summary.skipped}`);
  console.log(`  failed:  ${summary.failed}`);
  if (summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
