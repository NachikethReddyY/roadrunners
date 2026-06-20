"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  pivotTrackAction,
  submitChoiceAction,
} from "@/lib/actions/journey";
import { cn } from "@/lib/utils";

export type Choice = {
  id: string;
  label: string;
  description?: string | null;
};

type SkillOption = {
  slug: string;
  name: string;
};

type ChoicePanelProps = {
  journeyId: string;
  nodeId: string;
  choices: Choice[];
  skills: SkillOption[];
  decided?: boolean;
};

function ChoiceSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "min-h-11 w-full rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors",
        "hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--link)]",
        pending && "opacity-60"
      )}
    >
      <span className="block text-sm font-medium">{pending ? "Generating next step…" : label}</span>
    </button>
  );
}

export function ChoicePanel({
  journeyId,
  nodeId,
  choices,
  skills,
  decided = false,
}: ChoicePanelProps) {
  const [showPivot, setShowPivot] = useState(false);

  if (decided) {
    return (
      <p className="text-sm text-muted-foreground">
        Choice recorded — refresh if the next step hasn&apos;t appeared yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {choices.map((choice) => (
        <form key={choice.id} action={submitChoiceAction}>
          <input type="hidden" name="journeyId" value={journeyId} />
          <input type="hidden" name="nodeId" value={nodeId} />
          <input type="hidden" name="choiceId" value={choice.id} />
          <ChoiceSubmitButton label={choice.label} />
          {choice.description && (
            <p className="mt-1 px-1 text-sm text-muted-foreground">{choice.description}</p>
          )}
        </form>
      ))}

      {!showPivot ? (
        <button
          type="button"
          onClick={() => setShowPivot(true)}
          className="text-sm text-[var(--link)] hover:underline dark:text-[var(--link-on-dark)]"
        >
          Pivot to a different track →
        </button>
      ) : (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-medium">Pick a new skill track</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <form key={skill.slug} action={pivotTrackAction}>
                <input type="hidden" name="journeyId" value={journeyId} />
                <input type="hidden" name="pivotSkill" value={skill.slug} />
                <PivotButton name={skill.name} />
              </form>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowPivot(false)}
            className="mt-3 text-xs text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function PivotButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm",
        "hover:border-primary/40",
        pending && "opacity-60"
      )}
    >
      {pending ? "Pivoting…" : name}
    </button>
  );
}
