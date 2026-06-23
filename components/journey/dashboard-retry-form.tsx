"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { retryFirstNodeFormAction } from "@/lib/actions/roadmap";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardRetryFormProps = {
  journeyId: string;
};

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" }),
        pending && "opacity-60"
      )}
    >
      {pending ? "Generating…" : "Generate first step"}
    </button>
  );
}

export function DashboardRetryForm({ journeyId }: DashboardRetryFormProps) {
  const [state, formAction] = useActionState(retryFirstNodeFormAction, null);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-[var(--semantic-warning)]">First step not generated yet</p>
      {state && "error" in state && (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <form action={formAction}>
        <input type="hidden" name="journeyId" value={journeyId} />
        <RetryButton />
      </form>
    </div>
  );
}
