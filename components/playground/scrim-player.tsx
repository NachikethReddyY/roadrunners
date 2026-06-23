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
  className?: string;
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ScrimPlayer({
  durationMs,
  events,
  initialFiles,
  onStateChange,
  className,
}: ScrimPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const emitState = useCallback(
    (timeMs: number, readOnly: boolean) => {
      const applied = applyTimelineAt(initialFiles, events, timeMs);
      onStateChange({ ...applied, readOnly });
    },
    [events, initialFiles, onStateChange]
  );

  useEffect(() => {
    emitState(currentMs, playing);
  }, [currentMs, playing, emitState]);

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
    }
    setPlaying((p) => !p);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setCurrentMs(ms);
    setPlaying(false);
  };

  const applied = applyTimelineAt(initialFiles, events, currentMs);

  return (
    <div
      className={cn(
        "border-t border-[var(--hairline-warm)] bg-[var(--surface-dark)] px-4 py-3",
        className
      )}
    >
      {applied.caption && (
        <p className="mb-2 text-center text-sm text-[var(--on-dark-mute)]">
          {applied.caption}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-active)]"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={durationMs || 1}
          value={currentMs}
          onChange={handleSeek}
          className="h-2 flex-1 cursor-pointer accent-[var(--primary)]"
          aria-label="Scrim timeline"
        />
        <span className="shrink-0 font-mono text-xs text-[var(--on-dark-mute)]">
          {formatTime(currentMs)} / {formatTime(durationMs)}
        </span>
      </div>
      {!playing && (
        <p className="mt-1 text-center text-xs text-[var(--on-dark-mute)]">
          Paused — edit the code freely
        </p>
      )}
    </div>
  );
}
