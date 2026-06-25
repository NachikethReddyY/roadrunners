"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrepareScrimButtonProps = {
  scrimId: string;
  journeyId: string;
  label?: string;
  className?: string;
};

export function PrepareScrimButton({
  scrimId,
  journeyId,
  label = "Open full-screen CodeCast",
  className,
}: PrepareScrimButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prepare() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/scrims/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrimId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not prepare CodeCast");
      }
      router.push(`/journey/${journeyId}/scrim/${scrimId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare CodeCast");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={prepare}
        disabled={pending}
        className={cn(
          buttonVariants({
            className: "min-h-12 rounded-full px-6 text-sm",
          }),
          pending && "opacity-70",
          className
        )}
      >
        {pending ? "Preparing CodeCast..." : label}
      </button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
