"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acknowledgeNodeFormAction } from "@/lib/actions/journey";
import { XpToast } from "@/components/journey/xp-toast";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ContinueButtonProps = {
  journeyId: string;
  nodeId: string;
};

function ContinueButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ className: "h-11 w-full rounded-full" }), pending && "opacity-60")}
    >
      {pending ? "Saving and preparing next checkpoint…" : "Acknowledge and continue"}
    </button>
  );
}

export function ContinueForm({ journeyId, nodeId }: ContinueButtonProps) {
  const [state, formAction] = useActionState(acknowledgeNodeFormAction, null);

  return (
    <div className="space-y-3">
      <XpToast xpGain={state?.xpGain} />
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <form action={formAction}>
        <input type="hidden" name="journeyId" value={journeyId} />
        <input type="hidden" name="nodeId" value={nodeId} />
        <ContinueButton />
      </form>
    </div>
  );
}
