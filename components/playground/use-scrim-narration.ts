"use client";

import { useCallback, useEffect, useRef } from "react";
import { ROUTES } from "@/lib/constants/routes";

type UseScrimNarrationOptions = {
  caption: string | null;
  audioUrl?: string | null;
  enabled: boolean;
  playing: boolean;
};

export function useScrimNarration({
  caption,
  audioUrl,
  enabled,
  playing,
}: UseScrimNarrationOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCaptionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopAudio = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
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
          body: JSON.stringify({ text: caption }),
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
  }, [audioUrl, caption, enabled, playing, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);
}
