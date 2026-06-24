"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { retryNextNodeFormAction } from "@/lib/actions/journey";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RetryNextNodeFormProps = {
  journeyId: string;
  nodeId: string;
};

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ className: "h-11 rounded-full px-6" }), pending && "opacity-60")}
    >
      {pending ? "Generating…" : "Generate next step"}
    </button>
  );
}

export function RetryNextNodeForm({ journeyId, nodeId }: RetryNextNodeFormProps) {
  const [state, formAction] = useActionState(retryNextNodeFormAction, null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Your choice was saved, but the next step didn&apos;t generate. Try again.
      </p>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <form action={formAction}>
        <input type="hidden" name="journeyId" value={journeyId} />
        <input type="hidden" name="nodeId" value={nodeId} />
        <RetryButton />
      </form>
    </div>
  );
}
