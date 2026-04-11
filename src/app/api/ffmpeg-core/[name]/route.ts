import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/** FFmpeg.wasm loads core JS + wasm; serve from node_modules so CDN/blockers don’t break compression. */
export const runtime = "nodejs";

const ALLOWED = new Set(["ffmpeg-core.js", "ffmpeg-core.wasm"]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  if (!ALLOWED.has(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "node_modules", "@ffmpeg", "core", "dist", "esm", name);

  try {
    const buf = await readFile(filePath);
    const contentType = name.endsWith(".wasm") ? "application/wasm" : "application/javascript";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("FFmpeg core missing. Run: npm install @ffmpeg/core", { status: 503 });
  }
}
