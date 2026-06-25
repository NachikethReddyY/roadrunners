"use client";

import { Lightbulb, X } from "lucide-react";
import type { ScrimSlide } from "@/lib/schemas/playground";
import { buildTeachCoachHint } from "@/lib/playground/teach-coach";
import { cn } from "@/lib/utils";

type TeachCoachPanelProps = {
  open: boolean;
  code: string;
  output: string;
  activeSlide?: ScrimSlide | null;
  template?: string;
  onClose: () => void;
};

export function TeachCoachPanel({
  open,
  code,
  output,
  activeSlide,
  template,
  onClose,
}: TeachCoachPanelProps) {
  if (!open) return null;

  const hint = buildTeachCoachHint({ code, output, activeSlide, template });

  return (
    <aside
      className={cn(
        "absolute right-3 top-14 z-50 w-[min(22rem,calc(100vw-1.5rem))]",
        "rounded-xl border border-[var(--editor-border)] bg-[var(--challenge-surface-strong)]",
        "p-3 text-[var(--editor-text)] shadow-[0_18px_40px_rgba(38,37,30,0.10)] backdrop-blur"
      )}
      aria-label="Teach Me coach"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Lightbulb className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold">{hint.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--editor-text-muted)]">
            {hint.concept}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Teach Me coach"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--editor-text)]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--editor-border)] bg-[var(--surface-dark)] p-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--editor-text-muted)]">
          Coach
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--editor-text)]">
          {hint.nudge}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--editor-text-muted)]">
          Example reply
        </p>
        <pre className="mt-1 overflow-auto rounded-xl border border-[var(--editor-border)] bg-white p-2.5 font-mono text-[11px] leading-relaxed text-[var(--editor-text)]">
          {hint.example}
        </pre>
      </div>
    </aside>
  );
}
