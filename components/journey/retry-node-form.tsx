"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { retryFirstNodeFormAction } from "@/lib/actions/roadmap";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RetryNodeButtonProps = {
  journeyId: string;
};

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ className: "h-11 rounded-full px-6" }), pending && "opacity-60")}
    >
      {pending ? "Generating…" : "Generate first step"}
    </button>
  );
}

export function RetryNodeForm({ journeyId }: RetryNodeButtonProps) {
  const [state, formAction] = useActionState(retryFirstNodeFormAction, null);

  return (
    <div className="space-y-3">
      {state && "error" in state && (
        <p className="text-sm text-destructive" role="alert">
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
