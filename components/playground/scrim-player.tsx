"use client";

import { Headphones, Pause, Play, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ScrimChallengeDock } from "@/components/playground/scrim-challenge-dock";
import { useScrimNarration } from "@/components/playground/use-scrim-narration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ScrimChallengeEvent, ScrimEvent, ScrimNarration } from "@/lib/schemas/playground";
import { applyTimelineAt, captionEventAt } from "@/lib/schemas/playground";
import { cn } from "@/lib/utils";

type ScrimPlayerProps = {
  durationMs: number;
  events: ScrimEvent[];
  initialFiles: Record<string, string>;
  narration?: ScrimNarration;
  initialMs?: number;
  listenEnabled?: boolean;
  onListenToggle?: (enabled: boolean) => void;
  onStateChange: (state: {
    files: Record<string, string>;
    activeFile: string | null;
    caption: string | null;
    slideId: string | null;
    readOnly: boolean;
    currentMs: number;
    playing: boolean;
    challenge: ScrimChallengeEvent | null;
  }) => void;
  onRun?: () => void;
  onSaveCheckpoint?: () => void;
  onSaveAsScrim?: () => void;
  saveStatus?: "idle" | "saving" | "saved";
  forcePauseSignal?: number;
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
  readOnly: boolean,
  currentMs: number,
  challengeId: string | null
): string {
  return JSON.stringify({
    files: applied.files,
    activeFile: applied.activeFile,
    caption: applied.caption,
    slideId: applied.slideId,
    readOnly,
    currentMs: Math.floor(currentMs / 50) * 50,
    challengeId,
  });
}

function challengeIsSatisfied(
  challenge: ScrimChallengeEvent,
  payload: { files?: Record<string, string>; stdout?: string; stderr?: string; error?: string }
) {
  const completion = challenge.completion;
  if (!completion) {
    return !payload.error;
  }

  if (payload.error) return false;

  const fileContent = completion.path ? payload.files?.[completion.path] ?? "" : "";
  const output = [payload.stdout ?? "", payload.stderr ?? ""].join("\n");

  if (completion.file_must_include && !fileContent.includes(completion.file_must_include)) {
    return false;
  }
  if (
    completion.file_must_not_include &&
    fileContent.includes(completion.file_must_not_include)
  ) {
    return false;
  }
  if (completion.output_must_include && !output.includes(completion.output_must_include)) {
    return false;
  }

  return true;
}

export function ScrimPlayer({
  durationMs,
  events,
  initialFiles,
  narration,
  initialMs = 0,
  listenEnabled = false,
  onListenToggle,
  onStateChange,
  onRun,
  onSaveCheckpoint,
  onSaveAsScrim,
  saveStatus = "idle",
  forcePauseSignal = 0,
  className,
}: ScrimPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(initialMs);
  const [listenOn, setListenOn] = useState(listenEnabled);
  const [activeChallenge, setActiveChallenge] = useState<ScrimChallengeEvent | null>(null);
  const [skippedChallengeIds, setSkippedChallengeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [challengeStatus, setChallengeStatus] = useState<"idle" | "running" | "success">(
    "idle"
  );
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const rafRef = useRef<number | null>(null);
  const challengeTransitionTimerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lastRunAtRef = useRef<number>(-1);
  const lastFingerprintRef = useRef("");
  const lastChallengeGateRef = useRef(-1);
  const wasPlayingRef = useRef(false);
  const lastForcePauseRef = useRef(forcePauseSignal);
  const [, startTransition] = useTransition();

  const applied = applyTimelineAt(initialFiles, events, currentMs);
  const captionEvent = captionEventAt(events, currentMs);
  const audioIsMaster = listenOn && Boolean(narration?.audio_url);

  useScrimNarration({
    caption: applied.caption,
    speechText:
      captionEvent?.type === "caption" ? captionEvent.speech : undefined,
    audioUrl: captionEvent?.type === "caption" ? captionEvent.audio_url : undefined,
    lessonAudioUrl: narration?.audio_url,
    currentMs,
    enabled: listenOn,
    playing: playing && !activeChallenge,
    onTimeMs: (timeMs) => {
      setCurrentMs(Math.min(durationMs, timeMs));
    },
    onEnded: () => {
      setCurrentMs(durationMs);
      setPlaying(false);
    },
  });

  const emitState = useCallback(
    (timeMs: number, isPlaying: boolean, challenge: ScrimChallengeEvent | null) => {
      const state = applyTimelineAt(initialFiles, events, timeMs);
      const fingerprint = stateFingerprint(
        state,
        isPlaying && !challenge,
        timeMs,
        challenge?.id ?? null
      );
      if (fingerprint === lastFingerprintRef.current) return;
      lastFingerprintRef.current = fingerprint;
      onStateChange({
        ...state,
        readOnly: isPlaying && !challenge,
        currentMs: timeMs,
        playing: isPlaying,
        challenge,
      });
    },
    [events, initialFiles, onStateChange]
  );

  useEffect(() => {
    emitState(currentMs, playing, activeChallenge);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap editor at initialMs

  useEffect(() => {
    emitState(currentMs, playing, activeChallenge);
    const runEvent = events.find(
      (e) => e.type === "run" && e.t <= currentMs && e.t > lastRunAtRef.current
    );
    if (runEvent && playing && !activeChallenge) {
      lastRunAtRef.current = runEvent.t;
      onRun?.();
    }
  }, [activeChallenge, currentMs, emitState, events, onRun, playing]);

  useEffect(() => {
    if (!playing || activeChallenge) return;

    const challenge = events.find(
      (e): e is ScrimChallengeEvent =>
        e.type === "challenge" &&
        e.t > lastChallengeGateRef.current &&
        e.t <= currentMs &&
        !skippedChallengeIds.has(e.id) &&
        !completedChallengeIds.has(e.id)
    );

    if (challenge) {
      lastChallengeGateRef.current = challenge.t;
      setPlaying(false);
      setCurrentMs(challenge.t);
      setActiveChallenge(challenge);
      setChallengeStatus("idle");
      setChallengeFeedback(null);
    }
  }, [activeChallenge, completedChallengeIds, currentMs, events, playing, skippedChallengeIds]);

  useEffect(() => {
    if (wasPlayingRef.current && !playing && onSaveCheckpoint) {
      startTransition(() => onSaveCheckpoint());
    }
    wasPlayingRef.current = playing;
  }, [playing, onSaveCheckpoint]);

  useEffect(() => {
    if (!playing || audioIsMaster || activeChallenge) {
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
  }, [activeChallenge, audioIsMaster, durationMs, playing]);

  const startPlayback = useCallback(() => {
    if (activeChallenge) {
      setShowSkipDialog(true);
      return;
    }
    if (currentMs >= durationMs) {
      setCurrentMs(0);
      lastRunAtRef.current = -1;
      lastChallengeGateRef.current = -1;
    }
    setPlaying(true);
  }, [activeChallenge, currentMs, durationMs]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    startPlayback();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setCurrentMs(ms);
    setPlaying(false);
    setActiveChallenge(null);
    setShowSkipDialog(false);
    lastRunAtRef.current = -1;
    lastChallengeGateRef.current = ms;
  };

  const confirmSkipChallenge = () => {
    if (!activeChallenge) return;
    const skipped = activeChallenge;
    if (challengeTransitionTimerRef.current) {
      window.clearTimeout(challengeTransitionTimerRef.current);
      challengeTransitionTimerRef.current = null;
    }
    setSkippedChallengeIds((prev) => new Set(prev).add(skipped.id));
    setActiveChallenge(null);
    setChallengeStatus("idle");
    setChallengeFeedback(null);
    setShowSkipDialog(false);
    setCurrentMs(skipped.t + 1);
    setPlaying(true);
  };

  const completeChallenge = useCallback(() => {
    if (!activeChallenge) return;
    setChallengeStatus("running");
    if (challengeTransitionTimerRef.current) {
      window.clearTimeout(challengeTransitionTimerRef.current);
    }
    challengeTransitionTimerRef.current = window.setTimeout(() => {
      setChallengeStatus("success");
      setChallengeFeedback("Nice. Holding for 5 seconds, then continuing.");
      challengeTransitionTimerRef.current = window.setTimeout(() => {
        setCompletedChallengeIds((prev) => new Set(prev).add(activeChallenge.id));
        setActiveChallenge(null);
        setChallengeStatus("idle");
        setChallengeFeedback(null);
        setCurrentMs((prev) => Math.max(prev, activeChallenge.t + 1));
        setPlaying(true);
      }, 5000);
    }, 350);
  }, [activeChallenge]);

  useEffect(() => {
    if (!activeChallenge) return;
    const onRunWhileChallenge = (event: Event) => {
      const detail = (event as CustomEvent<{
        files?: Record<string, string>;
        stdout?: string;
        stderr?: string;
        error?: string;
      }>).detail;

      if (challengeIsSatisfied(activeChallenge, detail ?? {})) {
        completeChallenge();
        return;
      }

      setChallengeStatus("idle");
      setChallengeFeedback("Not quite yet. Change the variable, run again, and the lesson will continue.");
    };
    window.addEventListener("scrim:challenge-run", onRunWhileChallenge);
    return () => window.removeEventListener("scrim:challenge-run", onRunWhileChallenge);
  }, [activeChallenge, completeChallenge]);

  useEffect(
    () => () => {
      if (challengeTransitionTimerRef.current) {
        window.clearTimeout(challengeTransitionTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (forcePauseSignal === lastForcePauseRef.current) return;
    lastForcePauseRef.current = forcePauseSignal;
    setPlaying(false);
    setShowSkipDialog(false);
  }, [forcePauseSignal]);

  const toggleListen = () => {
    const next = !listenOn;
    setListenOn(next);
    onListenToggle?.(next);
  };

  const progress = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;
  const challengeMarkers = events.filter(
    (e): e is ScrimChallengeEvent => e.type === "challenge"
  );
  const activeChallengeMarker =
    activeChallenge && durationMs > 0 ? (activeChallenge.t / durationMs) * 100 : progress;

  return (
    <>
      <div className={cn("relative shrink-0 border-t border-[var(--editor-border)] bg-[var(--surface-dark)]", className)}>
        {activeChallenge && (
          <ScrimChallengeDock
            challenge={activeChallenge}
            status={challengeStatus}
            markerLeftPercent={activeChallengeMarker}
            onRun={onRun}
            feedback={challengeFeedback}
          />
        )}

        <div
          className={cn(
            "pointer-events-auto flex h-14 items-center gap-1.5 border-t border-[var(--editor-border)]/70 bg-[var(--player-surface)] px-2 backdrop-blur-md",
            "sm:gap-2 sm:px-3"
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

          {onListenToggle !== undefined && (
            <button
              type="button"
              onClick={toggleListen}
              aria-label={listenOn ? "Disable narration" : "Enable narration"}
              aria-pressed={listenOn}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full sm:size-9",
                listenOn
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "text-[var(--player-text-muted)] hover:bg-[var(--surface-dark-soft)]"
              )}
            >
              <Headphones className="size-4" />
            </button>
          )}

          <div className="relative min-w-0 flex-1">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[var(--primary)]/18"
              style={{ width: `${progress}%` }}
              aria-hidden
            />
            {activeChallenge && (
              <div
                className="pointer-events-none absolute bottom-full z-10 mb-1.5 w-px bg-gradient-to-t from-[var(--primary)] via-[var(--primary)]/45 to-transparent"
                style={{
                  left: `${activeChallengeMarker}%`,
                  height: "16px",
                }}
                aria-hidden
              />
            )}
            {challengeMarkers.map((marker) => (
              <span
                key={marker.id}
                className={cn(
                  "pointer-events-none absolute z-20 size-2 -translate-y-1/2 rounded-full transition-all duration-300",
                  activeChallenge?.id === marker.id
                    ? "bg-[var(--primary)] shadow-[0_0_0_5px_rgba(217,119,6,0.18)]"
                    : "bg-[var(--primary)]"
                )}
                style={{
                  top: "calc(50% + 3px)",
                  left: `${durationMs > 0 ? (marker.t / durationMs) * 100 : 0}%`,
                }}
                title={`Challenge: ${marker.title}`}
                aria-hidden
              />
            ))}
            <input
              type="range"
              min={0}
              max={durationMs || 1}
              value={currentMs}
              onChange={handleSeek}
              className={cn(
                "relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--player-track)] accent-[var(--primary)] transition-all duration-300 ease-in-out",
                activeChallenge && "shadow-[0_0_0_1px_rgba(217,119,6,0.24)] animate-pulse"
              )}
              aria-label="Lesson timeline"
            />
          </div>

          <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--player-text-muted)] sm:text-[11px]">
            {formatTime(currentMs)} / {formatTime(durationMs)}
          </span>

          {!playing && onSaveCheckpoint && (
            <button
              type="button"
              onClick={onSaveCheckpoint}
              disabled={saveStatus === "saving"}
              aria-label="Save progress"
              title="Save progress"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--player-text-muted)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--player-text)]"
            >
              <Save className="size-3.5" />
            </button>
          )}

          {!playing && onSaveAsScrim && (
            <button
              type="button"
              onClick={onSaveAsScrim}
              aria-label="Save as scrim"
              className="hidden shrink-0 rounded-full border border-[var(--editor-border)] px-2 py-1 text-[10px] text-[var(--player-text-muted)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--player-text)] sm:inline"
            >
              Save Scrim
            </button>
          )}
        </div>

        {!playing && !activeChallenge && (
          <p className="absolute -top-5 right-3 hidden text-[10px] text-[var(--player-text-muted)] sm:block">
            {saveStatus === "saved" ? "Progress saved" : "Paused — edit & run yourself"}
          </p>
        )}
      </div>

      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Skip this challenge?</DialogTitle>
            <DialogDescription>
              {activeChallenge
                ? `You can keep working on “${activeChallenge.title}”, or skip and let the lesson continue.`
                : "Skip and continue the lesson?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
              Keep working
            </Button>
            <Button onClick={confirmSkipChallenge}>Skip challenge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Notify ScrimPlayer that the user ran code during an active challenge. */
export function notifyScrimChallengeRun(detail?: {
  files?: Record<string, string>;
  stdout?: string;
  stderr?: string;
  error?: string;
}) {
  window.dispatchEvent(new CustomEvent("scrim:challenge-run", { detail }));
}
