let audioCtx: AudioContext | null = null;

const START_EXERCISE_VOICE_URL =
  "https://ppxjmpsircgmhdylqhlq.supabase.co/storage/v1/object/public/public_media/start-excercise-voice.mp3";

const REST_EXERCISE_VOICE_URL =
  "https://ppxjmpsircgmhdylqhlq.supabase.co/storage/v1/object/public/public_media/rest-exercise-voice.mp3";

let startVoiceBuffer: AudioBuffer | null = null;
let restVoiceBuffer: AudioBuffer | null = null;
let voiceBuffersPromise: Promise<void> | null = null;

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

async function loadVoiceBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load voice: ${url}`);
  const data = await res.arrayBuffer();
  return ctx.decodeAudioData(data);
}

async function ensureVoiceBuffers(ctx: AudioContext): Promise<void> {
  const [start, rest] = await Promise.all([
    startVoiceBuffer ? Promise.resolve(startVoiceBuffer) : loadVoiceBuffer(ctx, START_EXERCISE_VOICE_URL),
    restVoiceBuffer ? Promise.resolve(restVoiceBuffer) : loadVoiceBuffer(ctx, REST_EXERCISE_VOICE_URL),
  ]);
  startVoiceBuffer = start;
  restVoiceBuffer = rest;
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, when = ctx.currentTime): void {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(when);
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
  if (!ctx) return;
  void ctx.resume();
  if (!voiceBuffersPromise) {
    voiceBuffersPromise = ensureVoiceBuffers(ctx).catch(() => {
      voiceBuffersPromise = null;
    });
  }
}

function playStartVoiceAfterBeep(ctx: AudioContext, beepAt: number) {
  const voiceAt = beepAt + 0.18;
  if (startVoiceBuffer) {
    playBuffer(ctx, startVoiceBuffer, voiceAt);
    return;
  }
  void voiceBuffersPromise?.then(() => {
    if (startVoiceBuffer) playBuffer(ctx, startVoiceBuffer, ctx.currentTime);
  });
}

/** Beep then start voice when 3 seconds remain before work resumes. */
export function playRestEndingCue() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();
  const t = ctx.currentTime;
  beep(ctx, t, 988, 0.14);
  playStartVoiceAfterBeep(ctx, t);
}

/** Rest-exercise voice, then a beep when 3 seconds remain on work (before rest starts). */
export function playWorkEndingCue() {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();

  const playBeep = () => beep(ctx, ctx.currentTime, 880, 0.14);

  const playVoiceThenBeep = (buffer: AudioBuffer) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = playBeep;
    source.start();
  };

  if (restVoiceBuffer) {
    playVoiceThenBeep(restVoiceBuffer);
    return;
  }

  void voiceBuffersPromise?.then(() => {
    if (restVoiceBuffer) playVoiceThenBeep(restVoiceBuffer);
    else playBeep();
  });
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
