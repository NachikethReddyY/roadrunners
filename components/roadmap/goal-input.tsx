"use client";

import { ArrowRight } from "lucide-react";
import { forwardRef, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { MorphingText } from "@/components/ui/morphing-text";
import {
  placeholdersForMode,
} from "@/lib/roadmap/goal-placeholders";
import { cn } from "@/lib/utils";

type GoalInputProps = {
  mode: "learn" | "become";
  subject: string;
  onModeChange: (mode: "learn" | "become") => void;
  onSubjectChange: (value: string) => void;
  canSubmit: boolean;
  inputId?: string;
};

function SubmitArrowPending({
  disabled,
  className,
}: {
  disabled: boolean;
  className: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-label={pending ? "Building roadmap" : "Continue"}
      className={className}
    >
      <ArrowRight className={cn("size-5", pending && "animate-pulse")} />
    </button>
  );
}

function SubmitArrow({ disabled }: { disabled: boolean }) {
  const className = cn(
    "glass-submit flex size-11 shrink-0 items-center justify-center rounded-xl",
    "opacity-80 transition-all duration-200",
    "hover:border-primary/40 hover:bg-primary/15 hover:text-primary hover:opacity-100 hover:shadow-[0_0_20px_rgba(217,119,6,0.35)]",
    "disabled:pointer-events-none disabled:opacity-35"
  );

  return <SubmitArrowPending disabled={disabled} className={className} />;
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function reducedMotionServerSnapshot(): boolean {
  return false;
}

export const GoalInput = forwardRef<HTMLInputElement, GoalInputProps>(function GoalInput(
  {
    mode,
    subject,
    onModeChange,
    onSubjectChange,
    canSubmit,
    inputId = "roadmap-subject",
  },
  ref
) {
  const placeholders = placeholdersForMode(mode);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    reducedMotionSnapshot,
    reducedMotionServerSnapshot
  );
  const showPlaceholder = subject.trim().length === 0;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        <span className="roadmap-title font-heading text-xl font-semibold tracking-tight opacity-95 sm:text-2xl">
          I want to
        </span>
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as "learn" | "become")}
          className={cn(
            "glass-control h-10 cursor-pointer rounded-full px-4",
            "text-sm font-medium opacity-95 sm:text-base"
          )}
          aria-label="Goal mode"
        >
          <option value="learn" className="bg-popover text-popover-foreground">
            learn
          </option>
          <option value="become" className="bg-popover text-popover-foreground">
            become
          </option>
        </select>
      </div>

      <div className="goal-capsule glass-control flex w-full max-w-2xl items-center gap-2 rounded-2xl p-2 pl-4 sm:pl-5">
        <div className="relative min-w-0 flex-1">
          <input
            ref={ref}
            id={inputId}
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder={placeholders[0]}
            required
            minLength={3}
            className={cn(
              "glass-input relative z-[1] w-full border-0 bg-transparent py-2.5",
              "text-base focus:outline-none focus:ring-0",
              showPlaceholder && "placeholder:text-transparent"
            )}
            autoComplete="off"
          />
          {showPlaceholder && (
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden pt-2.5 pr-1"
              aria-hidden
            >
              {reducedMotion ? (
                <span className="block truncate text-left text-base text-[var(--glass-placeholder)]">
                  {placeholders[0]}
                </span>
              ) : (
                <MorphingText
                  key={mode}
                  align="left"
                  texts={[...placeholders]}
                  className="h-6 max-w-none text-base font-normal leading-normal text-[var(--glass-placeholder)] md:h-6 lg:text-base"
                />
              )}
            </div>
          )}
        </div>
        <SubmitArrow disabled={!canSubmit} />
      </div>
    </div>
  );
});
