/**
 * Browser-side H.264 compression via ffmpeg.wasm (same stack as Media Library).
 * Tuned for exercise demos: good quality on phones, smaller uploads / faster loads.
 */

const EXEC_TIMEOUT_MS = 600_000;
/** Skip encode when the source is already light enough for typical exercise demos. */
const DEFAULT_SKIP_BELOW_BYTES = 8 * 1024 * 1024;
/** Default max long-edge width — suits 9:16 phone clips and 16:9 landscape. */
const DEFAULT_MAX_WIDTH = 1080;
/** CRF 26 ≈ solid visual quality with a solid size cut vs phone originals. */
const DEFAULT_CRF = 26;

export type CompressVideoOptions = {
  crf?: number;
  maxWidth?: number;
  /** If source size is under this, return the original (default 8 MB). Set 0 to always encode. */
  skipBelowBytes?: number;
  onProgress?: (progress01: number) => void;
  onStatus?: (message: string) => void;
};

export type CompressVideoResult = {
  file: File;
  skipped: boolean;
  originalBytes: number;
  outputBytes: number;
};

function isVideoFile(f: File): boolean {
  if (f.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(f.name);
}

function ffmpegCoreBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/ffmpeg-core`;
}

function outFileName(source: File): string {
  const base = source.name.replace(/\.[^.]+$/, "") || "video";
  return `${base.replace(/[^a-zA-Z0-9._-]/g, "_")}-web.mp4`;
}

type FFmpegInstance = InstanceType<Awaited<typeof import("@ffmpeg/ffmpeg")>["FFmpeg"]>;

let sharedFfmpeg: FFmpegInstance | null = null;
let sharedLoaded = false;
let sharedLoadPromise: Promise<FFmpegInstance> | null = null;

async function getFfmpeg(
  onProgress?: (p: number) => void,
  onStatus?: (m: string) => void
): Promise<FFmpegInstance> {
  if (sharedFfmpeg && sharedLoaded) {
    sharedFfmpeg.on("progress", ({ progress }) => {
      onProgress?.(Math.min(1, Math.max(0, progress)));
    });
    return sharedFfmpeg;
  }

  if (!sharedLoadPromise) {
    sharedLoadPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ffmpeg = new FFmpeg();
      sharedFfmpeg = ffmpeg;

      onStatus?.("Loading video encoder (one-time, ~30 MB)…");
      const base = ffmpegCoreBaseUrl();
      try {
        await ffmpeg.load({
          coreURL: `${base}/ffmpeg-core.js`,
          wasmURL: `${base}/ffmpeg-core.wasm`,
        });
      } catch {
        const cdnBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, "application/wasm"),
        });
      }
      sharedLoaded = true;
      return ffmpeg;
    })().catch((e) => {
      sharedLoadPromise = null;
      sharedFfmpeg = null;
      sharedLoaded = false;
      throw e;
    });
  }

  const ffmpeg = await sharedLoadPromise;
  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)));
  });
  return ffmpeg;
}

/**
 * Compress a video for web exercise playback.
 * Falls back to the original file if encoding fails or the result is larger.
 */
export async function compressVideoForWeb(
  sourceFile: File,
  options: CompressVideoOptions = {}
): Promise<CompressVideoResult> {
  const originalBytes = sourceFile.size;
  const skipBelow = options.skipBelowBytes ?? DEFAULT_SKIP_BELOW_BYTES;
  const crf = options.crf ?? DEFAULT_CRF;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;

  if (!isVideoFile(sourceFile)) {
    throw new Error("Choose a video file.");
  }

  if (skipBelow > 0 && originalBytes <= skipBelow && /\.mp4$/i.test(sourceFile.name)) {
    options.onStatus?.("Video already small — uploading as-is.");
    return {
      file: sourceFile,
      skipped: true,
      originalBytes,
      outputBytes: originalBytes,
    };
  }

  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFfmpeg(options.onProgress, options.onStatus);

  const inputName = "input" + (sourceFile.name.match(/\.[^.]+$/)?.[0] || ".mp4");
  await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));
  options.onStatus?.("Compressing for faster playback…");
  options.onProgress?.(0);

  const vfScaleFilter = maxWidth > 0 ? `scale=w=min(${maxWidth}\\,iw):h=-2` : "";

  function h264Args(audio: "aac" | "none", withScale: boolean): string[] {
    const map =
      audio === "aac"
        ? (["-map", "0:v:0", "-map", "0:a:0?"] as const)
        : (["-map", "0:v:0"] as const);
    const a =
      audio === "aac" ? (["-c:a", "aac", "-b:a", "96k"] as const) : (["-an"] as const);
    const vf = withScale && vfScaleFilter ? (["-vf", vfScaleFilter] as const) : [];
    return [
      "-i",
      inputName,
      ...map,
      "-threads",
      "1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      String(crf),
      "-preset",
      "veryfast",
      ...vf,
      ...a,
      "-movflags",
      "+faststart",
      "out.mp4",
    ];
  }

  function mpeg4Args(withScale: boolean): string[] {
    const vf = withScale && vfScaleFilter ? (["-vf", vfScaleFilter] as const) : [];
    return [
      "-i",
      inputName,
      "-map",
      "0:v:0",
      "-threads",
      "1",
      "-c:v",
      "mpeg4",
      "-q:v",
      "6",
      ...vf,
      "-an",
      "-movflags",
      "+faststart",
      "out.mp4",
    ];
  }

  const attempts: string[][] = [
    h264Args("none", maxWidth > 0),
    h264Args("aac", maxWidth > 0),
    h264Args("none", false),
    h264Args("aac", false),
    mpeg4Args(maxWidth > 0),
    mpeg4Args(false),
  ];

  let lastCode = 1;
  for (const args of attempts) {
    await ffmpeg.deleteFile("out.mp4").catch(() => {});
    const code = await ffmpeg.exec(args, EXEC_TIMEOUT_MS);
    lastCode = code;
    if (code === 0) break;
  }

  if (lastCode !== 0) {
    await ffmpeg.deleteFile(inputName).catch(() => {});
    throw new Error("Video compression failed. Try a smaller file or MP4 format.");
  }

  const raw = await ffmpeg.readFile("out.mp4");
  const src =
    raw instanceof Uint8Array ? raw : new Uint8Array(raw as unknown as ArrayBuffer);
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  await ffmpeg.deleteFile(inputName).catch(() => {});
  await ffmpeg.deleteFile("out.mp4").catch(() => {});

  if (copy.byteLength < 1024) {
    throw new Error("Compressed file looked invalid.");
  }

  // Prefer original if encode somehow grew the file.
  if (copy.byteLength >= originalBytes) {
    options.onStatus?.("Compressed file was larger — keeping original.");
    return {
      file: sourceFile,
      skipped: true,
      originalBytes,
      outputBytes: originalBytes,
    };
  }

  const blob = new Blob([copy], { type: "video/mp4" });
  const file = new File([blob], outFileName(sourceFile), { type: "video/mp4" });
  options.onProgress?.(1);
  options.onStatus?.(
    `Compressed ${(originalBytes / (1024 * 1024)).toFixed(1)} MB → ${(file.size / (1024 * 1024)).toFixed(1)} MB`
  );

  return {
    file,
    skipped: false,
    originalBytes,
    outputBytes: file.size,
  };
}

export function isCompressibleVideoFile(f: File | null): boolean {
  return f != null && isVideoFile(f);
}
