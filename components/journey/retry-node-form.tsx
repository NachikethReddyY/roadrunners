"use client";

import { useFormStatus } from "react-dom";
import { retryFirstNodeAction } from "@/lib/actions/roadmap";
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
  return (
    <form action={retryFirstNodeAction}>
      <input type="hidden" name="journeyId" value={journeyId} />
      <RetryButton />
    </form>
  );
}
