"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Clock3, GitBranch, LockKeyhole, Route } from "lucide-react";
import {
  pivotTrackFormAction,
  submitChoiceFormAction,
  type JourneyActionState,
} from "@/lib/actions/journey";
import { RetryNextNodeForm } from "@/components/journey/retry-next-node-form";
import { XpToast } from "@/components/journey/xp-toast";
import {
  buildPivotChoices,
  presentFeatureChoices,
  type ChoicePresentationInput,
  type FeatureChoice,
} from "@/lib/journey/presentation";
import { cn } from "@/lib/utils";

export type Choice = ChoicePresentationInput;

type SkillOption = {
  slug: string;
  name: string;
  category?: string;
};

type ChoicePanelProps = {
  journeyId: string;
  nodeId: string;
  choices: Choice[];
  skills: SkillOption[];
  roadmapGoal?: string;
  currentSkillTag?: string;
  pivotChoices?: Choice[];
  decided?: boolean;
  generationFailed?: boolean;
};

function ChoiceSubmitButton({
  choice,
  disabled,
}: {
  choice: FeatureChoice;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const unavailable = choice.availability !== "unlocked";
  const isDisabled = disabled || pending || unavailable;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-describedby={`choice-${choice.id}-details`}
      className={cn(
        "min-h-11 w-full rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--link)]",
        !isDisabled && "hover:border-primary/40 hover:bg-primary/5",
        isDisabled && "cursor-not-allowed bg-muted/60 opacity-70"
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-heading text-base font-semibold">
          {pending ? "Saving your choice…" : choice.title}
        </span>
        {choice.isPivot ? (
          <Route className="mt-0.5 size-4 shrink-0 text-[var(--link)]" aria-hidden />
        ) : choice.availability === "locked" ? (
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <GitBranch className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </span>
    </button>
  );
}

function ChoiceDetails({ choice }: { choice: FeatureChoice }) {
  return (
    <div id={`choice-${choice.id}-details`} className="space-y-3 px-1 pb-1 pt-2">
      <p className="text-sm leading-relaxed text-muted-foreground">{choice.description}</p>
      <p className="text-sm">
        <span className="font-medium">Project contribution:</span>{" "}
        <span className="text-muted-foreground">{choice.projectContribution}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {choice.estimatedMinutes && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock3 className="size-3.5" aria-hidden />
            About {choice.estimatedMinutes} min
          </span>
        )}
        {choice.concepts.map((concept) => (
          <span key={concept} className="rounded-full border border-border px-2.5 py-1">
            {concept}
          </span>
        ))}
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-medium",
            choice.availability === "unlocked" && "border-emerald-600/30 text-[var(--semantic-success)]",
            choice.availability === "deferred" && "border-primary/30 text-primary",
            choice.availability === "locked" && "border-border text-muted-foreground"
          )}
        >
          {choice.availability === "unlocked"
            ? "Available"
            : choice.availability === "deferred"
              ? "Deferred — can return later"
              : "Locked"}
        </span>
      </div>
      {choice.availability === "locked" && choice.prerequisites?.length ? (
        <p className="text-xs text-muted-foreground">
          Requires: {choice.prerequisites.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export function ChoicePanel({
  journeyId,
  nodeId,
  choices,
  skills,
  roadmapGoal = "this roadmap goal",
  currentSkillTag,
  pivotChoices,
  decided = false,
  generationFailed = false,
}: ChoicePanelProps) {
  const [showPivot, setShowPivot] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [choiceState, choiceAction] = useActionState<JourneyActionState, FormData>(
    submitChoiceFormAction,
    null
  );
  const [pivotState, pivotAction] = useActionState<JourneyActionState, FormData>(
    pivotTrackFormAction,
    null
  );

  const featureChoices = useMemo(
    () => presentFeatureChoices(choices, { roadmapGoal, currentSkillTag }),
    [choices, currentSkillTag, roadmapGoal]
  );
  const presentedPivots = useMemo(
    () =>
      pivotChoices?.length
        ? presentFeatureChoices(pivotChoices, { roadmapGoal, currentSkillTag })
        : buildPivotChoices(skills, { roadmapGoal, currentSkillTag }),
    [currentSkillTag, pivotChoices, roadmapGoal, skills]
  );

  const submissionLocked =
    submittingId !== null && !choiceState?.error && !pivotState?.error;

  if (decided && generationFailed) {
    return <RetryNextNodeForm journeyId={journeyId} nodeId={nodeId} />;
  }

  if (decided) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Choice recorded — preparing the next checkpoint…
      </p>
    );
  }

  return (
    <section aria-labelledby="checkpoint-choices-title" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Next checkpoint
        </p>
        <h2 id="checkpoint-choices-title" className="font-heading text-lg font-semibold">
          Choose a feature outcome
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick one direction. Deferred options remain visible for later.
        </p>
      </div>

      <XpToast xpGain={choiceState?.xpGain ?? pivotState?.xpGain} />

      {(choiceState?.error || pivotState?.error) && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-destructive dark:bg-red-950/30" role="alert">
          {choiceState?.error ?? pivotState?.error}
        </p>
      )}

      <div className="space-y-3">
        {featureChoices.map((choice) => (
          <div key={choice.id} className={cn(choice.isPivot && "rounded-xl border border-dashed border-[var(--link)]/30 p-2")}>
            <form
              action={choiceAction}
              onSubmit={() => setSubmittingId(choice.id)}
            >
              <input type="hidden" name="journeyId" value={journeyId} />
              <input type="hidden" name="nodeId" value={nodeId} />
              <input type="hidden" name="choiceId" value={choice.id} />
              <ChoiceSubmitButton choice={choice} disabled={submissionLocked} />
            </form>
            <ChoiceDetails choice={choice} />
          </div>
        ))}
      </div>

      {presentedPivots.length > 0 && (
        !showPivot ? (
          <button
            type="button"
            onClick={() => setShowPivot(true)}
            className="min-h-11 text-sm font-medium text-[var(--link)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--link)] dark:text-[var(--link-on-dark)]"
          >
            Explore a compatible track pivot →
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--link)]/35 bg-blue-50/50 p-4 dark:bg-blue-950/10">
            <div className="mb-3">
              <p className="text-sm font-semibold">Compatible track pivots</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A pivot adds a new field to this project. It never moves you automatically.
              </p>
            </div>
            <div className="space-y-3">
              {presentedPivots.map((choice) => (
                <div key={choice.id}>
                  {choice.availability === "unlocked" ? (
                    <form
                      action={pivotAction}
                      onSubmit={() => setSubmittingId(choice.id)}
                    >
                      <input type="hidden" name="journeyId" value={journeyId} />
                      <input type="hidden" name="pivotSkill" value={choice.targetSkillTag} />
                      <ChoiceSubmitButton choice={choice} disabled={submissionLocked} />
                    </form>
                  ) : (
                    <div aria-disabled="true">
                      <ChoiceSubmitButton choice={choice} disabled />
                    </div>
                  )}
                  <ChoiceDetails choice={choice} />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPivot(false)}
              className="mt-3 min-h-11 text-sm text-muted-foreground hover:underline"
            >
              Close pivot options
            </button>
          </div>
        )
      )}
    </section>
  );
}
