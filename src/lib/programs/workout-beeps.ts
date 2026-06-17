let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function beep(ctx: AudioContext, at: number, freq = 880, duration = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

export function prepareWorkoutAudio() {
  const ctx = getCtx();
  if (ctx) void ctx.resume();
}

/** Single tone when a timed work interval reaches zero. */
export function playWorkEndBeep() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();
  const t = ctx.currentTime;
  beep(ctx, t, 988, 0.22);
}

export function playDoubleBeep() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();
  const t = ctx.currentTime;
  beep(ctx, t, 880);
  beep(ctx, t + 0.16, 660);
}
