"use client";

import { useState, useTransition } from "react";
import { saveUserScrim } from "@/lib/actions/scrim";
import type { PlaygroundTemplate, ScrimSlide, ScrimTimeline } from "@/lib/schemas/playground";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveScrimDialogProps = {
  open: boolean;
  defaultTitle: string;
  journeyId: string;
  sourceNodeId?: string;
  sourceLessonScrimId?: string;
  skillTag?: string;
  template: PlaygroundTemplate;
  initialFiles: Record<string, string>;
  timeline: ScrimTimeline;
  slides: ScrimSlide[];
  durationMs: number;
  resumeTimelineMs: number;
  onClose: () => void;
  onSaved?: (scrimId: string) => void;
};

export function SaveScrimDialog({
  open,
  defaultTitle,
  journeyId,
  sourceNodeId,
  sourceLessonScrimId,
  skillTag,
  template,
  initialFiles,
  timeline,
  slides,
  durationMs,
  resumeTimelineMs,
  onClose,
  onSaved,
}: SaveScrimDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveUserScrim({
        journeyId,
        title: title.trim() || defaultTitle,
        sourceNodeId,
        sourceLessonScrimId,
        skillTag,
        template,
        initialFiles,
        timeline,
        slides,
        durationMs,
        resumeTimelineMs,
      });
      if (!result.ok) {
        setError(result.error ?? "Save failed");
        return;
      }
      if (result.scrimId) onSaved?.(result.scrimId);
      onClose();
    });
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-scrim-title"
    >
      <div
        className={cn(
          "w-full max-w-md rounded-xl border border-[var(--hairline-warm)] bg-[var(--surface)] p-5 shadow-xl"
        )}
      >
        <h2 id="save-scrim-title" className="font-heading text-lg font-semibold">
          Save Scrim
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep a reusable copy you can reopen from your scrim library.
        </p>
        <label className="mt-4 block text-sm font-medium" htmlFor="scrim-title">
          Title
        </label>
        <input
          id="scrim-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          maxLength={120}
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? "Saving..." : "Save Scrim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
