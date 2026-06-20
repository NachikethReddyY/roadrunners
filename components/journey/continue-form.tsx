"use client";

import { useFormStatus } from "react-dom";
import { acknowledgeNodeAction } from "@/lib/actions/journey";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ContinueButtonProps = {
  journeyId: string;
  nodeId: string;
};

export function ContinueButton({ journeyId, nodeId }: ContinueButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ className: "h-11 w-full rounded-full" }), pending && "opacity-60")}
    >
      {pending ? "Generating next step…" : "Continue"}
    </button>
  );
}

export function ContinueForm({ journeyId, nodeId }: ContinueButtonProps) {
  return (
    <form action={acknowledgeNodeAction}>
      <input type="hidden" name="journeyId" value={journeyId} />
      <input type="hidden" name="nodeId" value={nodeId} />
      <ContinueButton journeyId={journeyId} nodeId={nodeId} />
    </form>
  );
}
