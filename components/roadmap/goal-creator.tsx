"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createRoadmapFormAction, type CreateRoadmapFormState } from "@/lib/actions/roadmap";
import {
  filterKeyForGoal,
  filterSkillsForGoal,
} from "@/lib/roadmap/filter-skills";
import type { SkillBubble } from "@/lib/schemas/roadmap";
import { GoalInput } from "@/components/roadmap/goal-input";
import { SkillBubbleField } from "@/components/roadmap/skill-bubble-field";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { cn } from "@/lib/utils";

type GoalCreatorProps = {
  skills: SkillBubble[];
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function GoalCreator({ skills }: GoalCreatorProps) {
  const [mode, setMode] = useState<"learn" | "become">("become");
  const [subject, setSubject] = useState("");
  const [lockedSkills, setLockedSkills] = useState<SkillBubble[] | null>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = subject.trim().length >= 3;

  const debouncedSubject = useDebouncedValue(subject, 280);

  const filteredSkills = useMemo(() => {
    if (lockedSkills) return lockedSkills;
    return filterSkillsForGoal(skills, mode, debouncedSubject);
  }, [skills, mode, debouncedSubject, lockedSkills]);

  const filterKey = lockedSkills
    ? `locked:${lockedSkills.map((s) => s.slug).join(",")}`
    : filterKeyForGoal(mode, debouncedSubject);

  function handleModeChange(next: "learn" | "become") {
    setMode(next);
    setSubject("");
    setLockedSkills(null);
  }

  function handleSubjectChange(value: string) {
    setSubject(value);
    setLockedSkills(null);
  }

  function handleBubblePick(name: string) {
    setLockedSkills(filteredSkills);
    setMode("learn");
    setSubject(name);
  }

  const [formState, formAction] = useActionState<CreateRoadmapFormState, FormData>(
    createRoadmapFormAction,
    null
  );

  return (
    <div className="roadmap-canvas relative min-h-[100dvh] w-full overflow-hidden">
      <div className="roadmap-canvas-glow pointer-events-none absolute inset-0" aria-hidden />
      <ProgressiveBlur height="18%" position="top" className="z-[5]" />
      <ProgressiveBlur height="22%" position="bottom" className="z-[5]" />

      <SkillBubbleField
        skills={filteredSkills}
        filterKey={filterKey}
        exclusionRef={centerRef}
        inputRef={inputRef}
        onPick={handleBubblePick}
      />

      <div className="pointer-events-none relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div
          ref={centerRef}
          className="pointer-events-auto flex w-full max-w-2xl flex-col items-center gap-8 px-2 py-8 sm:px-4"
        >
          <div className="pointer-events-none text-center">
            <p className="roadmap-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              New roadmap
            </p>
            <h1 className="roadmap-title font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              What do you want to explore?
            </h1>
            <p className="roadmap-subtitle mt-3">
              Type a goal or tap a bubble — we&apos;ll build your first step.
            </p>
          </div>

          <form
            action={formAction}
            className="relative flex w-full flex-col items-center gap-6"
          >
            <input type="hidden" name="mode" value={mode} />
            {formState && "error" in formState && (
              <p className="text-sm text-destructive" role="alert">
                {formState.error}
              </p>
            )}
            <GoalInput
              ref={inputRef}
              mode={mode}
              subject={subject}
              onModeChange={handleModeChange}
              onSubjectChange={handleSubjectChange}
              canSubmit={canSubmit}
            />
            <LoadingOverlay />
          </form>
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div
      className={cn(
        "roadmap-loading-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
        "backdrop-blur-md"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="roadmap-title font-heading text-xl font-semibold">Building your roadmap…</p>
      <p className="roadmap-subtitle text-sm">Generating your first step</p>
    </div>
  );
}
