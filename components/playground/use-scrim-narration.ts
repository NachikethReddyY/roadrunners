"use client";

import { useCallback, useEffect, useRef } from "react";
import { ROUTES } from "@/lib/constants/routes";

type UseScrimNarrationOptions = {
  caption: string | null;
  speechText?: string | null;
  audioUrl?: string | null;
  lessonAudioUrl?: string | null;
  currentMs?: number;
  enabled: boolean;
  playing: boolean;
  onTimeMs?: (timeMs: number) => void;
  onEnded?: () => void;
};

export function useScrimNarration({
  caption,
  speechText,
  audioUrl,
  lessonAudioUrl,
  currentMs = 0,
  enabled,
  playing,
  onTimeMs,
  onEnded,
}: UseScrimNarrationOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCaptionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lessonAudioUrlRef = useRef<string | null>(null);
  const onTimeMsRef = useRef(onTimeMs);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onTimeMsRef.current = onTimeMs;
    onEndedRef.current = onEnded;
  }, [onEnded, onTimeMs]);

  const stopAudio = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!lessonAudioUrl) return;
    if (lessonAudioUrlRef.current === lessonAudioUrl && audioRef.current) return;
    stopAudio();
    lessonAudioUrlRef.current = lessonAudioUrl;
    audioRef.current = new Audio(lessonAudioUrl);
  }, [lessonAudioUrl, stopAudio]);

  useEffect(() => {
    if (!lessonAudioUrl) return;
    const audio = audioRef.current;
    if (!audio || !enabled) {
      if (audio) audio.pause();
      return;
    }

    const targetSeconds = currentMs / 1000;
    if (Number.isFinite(targetSeconds) && Math.abs(audio.currentTime - targetSeconds) > 0.35) {
      audio.currentTime = targetSeconds;
    }

    if (playing) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentMs, enabled, lessonAudioUrl, playing]);

  useEffect(() => {
    if (!lessonAudioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      onEndedRef.current?.();
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [lessonAudioUrl]);

  // ponytail: rAF sync beats flaky timeupdate for timeline-driven editor updates
  useEffect(() => {
    if (!lessonAudioUrl || !enabled || !playing) return;
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;
    const tick = () => {
      onTimeMsRef.current?.(Math.round(audio.currentTime * 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, lessonAudioUrl, playing]);

  useEffect(() => {
    if (lessonAudioUrl) return;
    if (!enabled || !playing || !caption || caption === lastCaptionRef.current) {
      if (!playing) stopAudio();
      return;
    }
    lastCaptionRef.current = caption;

    const playFromUrl = (url: string) => {
      stopAudio();
      const audio = new Audio(url);
      audioRef.current = audio;
      void audio.play().catch(() => {});
    };

    if (audioUrl) {
      playFromUrl(audioUrl);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    void (async () => {
      try {
        const res = await fetch(ROUTES.ttsScrimCaption, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: caption,
            speech: speechText ?? undefined,
          }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { audioUrl?: string };
        if (data.audioUrl && !controller.signal.aborted) {
          playFromUrl(data.audioUrl);
        }
      } catch {
        // TTS optional — silent fail
      }
    })();

    return () => {
      controller.abort();
    };
  }, [audioUrl, caption, enabled, lessonAudioUrl, playing, speechText, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);
}
