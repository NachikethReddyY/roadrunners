"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ScrimEvent } from "@/lib/schemas/playground";
import { applyTimelineAt } from "@/lib/schemas/playground";
import { cn } from "@/lib/utils";

type ScrimPlayerProps = {
  durationMs: number;
  events: ScrimEvent[];
  initialFiles: Record<string, string>;
  onStateChange: (state: {
    files: Record<string, string>;
    activeFile: string | null;
    caption: string | null;
    slideId: string | null;
    readOnly: boolean;
  }) => void;
  onRun?: () => void;
  className?: string;
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function stateFingerprint(
  applied: ReturnType<typeof applyTimelineAt>,
  readOnly: boolean
): string {
  return JSON.stringify({
    files: applied.files,
    activeFile: applied.activeFile,
    caption: applied.caption,
    slideId: applied.slideId,
    readOnly,
  });
}

export function ScrimPlayer({
  durationMs,
  events,
  initialFiles,
  onStateChange,
  onRun,
  className,
}: ScrimPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lastRunAtRef = useRef<number>(-1);
  const lastFingerprintRef = useRef("");

  const emitState = useCallback(
    (timeMs: number, readOnly: boolean) => {
      const applied = applyTimelineAt(initialFiles, events, timeMs);
      const fingerprint = stateFingerprint(applied, readOnly);
      if (fingerprint === lastFingerprintRef.current) return;
      lastFingerprintRef.current = fingerprint;
      onStateChange({ ...applied, readOnly });
    },
    [events, initialFiles, onStateChange]
  );

  useEffect(() => {
    emitState(currentMs, playing);
    const runEvent = events.find(
      (e) => e.type === "run" && e.t <= currentMs && e.t > lastRunAtRef.current
    );
    if (runEvent) {
      lastRunAtRef.current = runEvent.t;
      onRun?.();
    }
  }, [currentMs, playing, emitState, events, onRun]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTickRef.current !== null) {
        const delta = now - lastTickRef.current;
        setCurrentMs((prev) => {
          const next = prev + delta;
          if (next >= durationMs) {
            setPlaying(false);
            return durationMs;
          }
          return next;
        });
      }
      lastTickRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, durationMs]);

  const togglePlay = () => {
    if (!playing && currentMs >= durationMs) {
      setCurrentMs(0);
      lastRunAtRef.current = -1;
    }
    setPlaying((p) => !p);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setCurrentMs(ms);
    setPlaying(false);
    lastRunAtRef.current = -1;
  };

  const applied = applyTimelineAt(initialFiles, events, currentMs);
  const progress = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;

  return (
    <div className={cn("relative shrink-0 pointer-events-none", className)}>
      {applied.caption && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-3 bottom-full z-30 mb-2",
            "rounded-lg border border-[var(--primary)]/30 bg-[#1c1b19]/95 px-4 py-2.5",
            "text-center text-sm leading-snug text-[var(--on-dark)] shadow-lg shadow-black/40",
            "backdrop-blur-sm"
          )}
        >
          {applied.caption}
        </div>
      )}

      <div
        className={cn(
          "pointer-events-auto flex h-12 items-center gap-2 border-t border-[var(--hairline-warm)] bg-[#16150f] px-3",
          "sm:gap-3 sm:px-4"
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause lesson" : "Play lesson"}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
            "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20",
            "transition-transform active:scale-[0.94] hover:bg-[var(--primary-active)]"
          )}
        >
          {playing ? (
            <Pause className="size-4 sm:size-5" />
          ) : (
            <Play className="size-4 pl-0.5 sm:size-5" />
          )}
        </button>

        <div className="relative min-w-0 flex-1">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[var(--primary)]/20"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
          <input
            type="range"
            min={0}
            max={durationMs || 1}
            value={currentMs}
            onChange={handleSeek}
            className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--surface-dark-soft)] accent-[var(--primary)]"
            aria-label="Lesson timeline"
          />
        </div>

        <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--on-dark-mute)] sm:text-[11px]">
          {formatTime(currentMs)} / {formatTime(durationMs)}
        </span>
      </div>

      {!playing && (
        <p className="absolute -top-5 right-3 hidden text-[10px] text-[var(--on-dark-mute)] sm:block">
          Paused — edit &amp; run yourself
        </p>
      )}
    </div>
  );
}
