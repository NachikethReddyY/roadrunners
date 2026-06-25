"use client";

import { CheckCircle2, Loader2, Play, Sparkles, Target } from "lucide-react";
import type { ScrimChallengeEvent } from "@/lib/schemas/playground";
import { cn } from "@/lib/utils";

type ScrimChallengeDockProps = {
  challenge: ScrimChallengeEvent;
  status: "idle" | "running" | "success";
  markerLeftPercent: number;
  feedback?: string | null;
  onRun?: () => void;
  className?: string;
};

function inlineCodeTokens(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded-md border border-[var(--editor-border)] bg-[var(--surface-dark)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--editor-text)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function ScrimChallengeDock({
  challenge,
  status,
  markerLeftPercent,
  feedback,
  onRun,
  className,
}: ScrimChallengeDockProps) {
  return (
    <div
      className={cn(
        "relative border-t border-[var(--editor-border)]/80 bg-[var(--surface-dark)]",
        "px-3 py-3 sm:px-4",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 w-px bg-gradient-to-t from-[var(--primary)] via-[var(--primary)]/40 to-transparent"
        style={{
          left: `clamp(1rem, ${markerLeftPercent}%, calc(100% - 1rem))`,
          height: "calc(100% + 12px)",
        }}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--challenge-surface-strong)]",
          "shadow-[0_4px_18px_rgba(38,37,30,0.06),inset_0_1px_0_rgba(255,255,255,0.85)]",
          "transition-all duration-300 ease-in-out",
          status === "success" && "border-emerald-500/35",
          status === "running" && "border-[var(--primary)]/40"
        )}
      >
        {status === "running" && (
          <div className="absolute inset-0 translate-x-[-100%] animate-[challenge-shimmer_1.2s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(217,119,6,0.08),transparent)]" />
        )}

        <div className="relative grid gap-3 p-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/8 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                <Target className="size-3" />
                Challenge
              </span>
              {status === "success" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" />
                  Complete
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--foreground)] sm:text-[15px]">
              {challenge.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {inlineCodeTokens(challenge.instructions)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--editor-text-muted)]">
              Hint
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {challenge.hint
                ? inlineCodeTokens(challenge.hint)
                : "Edit the code, then run it to keep the lesson moving."}
            </p>
          </div>

          <div className="flex items-center justify-start sm:justify-end">
            <button
              type="button"
              onClick={onRun}
              disabled={status === "running" || status === "success"}
              className={cn(
                "inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl px-4",
                "bg-[var(--primary)] text-sm font-semibold text-white",
                "shadow-[0_0_0_1px_rgba(217,119,6,0.22),0_8px_24px_rgba(217,119,6,0.22)]",
                "transition-all duration-300 ease-in-out hover:bg-[var(--primary-active)] disabled:cursor-default",
                status === "idle" && "animate-pulse",
                status === "running" && "bg-[var(--primary-active)]/85 text-white/90",
                status === "success" && "bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)]"
              )}
            >
              {status === "running" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Running
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Continuing
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  Run Code
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative flex items-center gap-2 border-t border-[var(--editor-border)]/70 px-3 py-2 text-[11px] text-[var(--editor-text-muted)] sm:px-4">
          <Sparkles className="size-3.5 text-[var(--primary)]/80" />
          <p>
            {feedback ??
              (status === "success"
                ? "Nice. Resuming the lesson automatically."
                : "The lesson is paused here so you can try the step yourself.")}
          </p>
        </div>
      </div>
    </div>
  );
}
