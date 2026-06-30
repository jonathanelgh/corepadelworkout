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

function playToneSequence(ctx: AudioContext, freqs: number[], spacing = 0.2, duration = 0.14) {
  const t = ctx.currentTime;
  for (let i = 0; i < freqs.length; i++) {
    beep(ctx, t + i * spacing, freqs[i]!, duration);
  }
}

export function prepareWorkoutAudio() {
  const ctx = getCtx();
  if (ctx) void ctx.resume();
}

/** Three ascending tones when a timed work interval starts. */
export function playExerciseStartBeeps() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();
  playToneSequence(ctx, [784, 988, 1175]);
}

/** Three descending tones when a timed work interval ends. */
export function playExerciseEndBeeps() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();
  playToneSequence(ctx, [988, 784, 587]);
}

/** @deprecated Use playExerciseEndBeeps for timed work intervals. */
export function playWorkEndBeep() {
  playExerciseEndBeeps();
}

/** @deprecated Rest transitions no longer use double beeps. */
export function playDoubleBeep() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();
  const t = ctx.currentTime;
  beep(ctx, t, 880);
  beep(ctx, t + 0.16, 660);
}
