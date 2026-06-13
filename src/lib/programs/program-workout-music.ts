"use client";

import { useEffect, useRef } from "react";

const REST_VOLUME = 0.07;
const WORK_VOLUME = 1;

export function useProgramWorkoutMusic(
  songUrl: string | null | undefined,
  options: {
    enabled: boolean;
    muted: boolean;
    isRestPhase: boolean;
    isRunning: boolean;
  }
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = songUrl?.trim();
    if (!url || !options.enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [songUrl, options.enabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !options.enabled) return;

    if (options.muted || !options.isRunning) {
      audio.pause();
      return;
    }

    const vol = options.isRestPhase ? REST_VOLUME : WORK_VOLUME;
    audio.volume = vol;
    void audio.play().catch(() => {});
  }, [options.enabled, options.muted, options.isRestPhase, options.isRunning]);
}
