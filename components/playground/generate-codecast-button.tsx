"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GenerateCodecastButtonProps = {
  journeyId: string;
  nodeId: string;
  label?: string;
  className?: string;
};

export function GenerateCodecastButton({
  journeyId,
  nodeId,
  label = "Generate CodeCast",
  className,
}: GenerateCodecastButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/scrims/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, nodeId }),
      });
      const raw = await res.text();
      let data: { error?: string; route?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string; route?: string };
        } catch {
          throw new Error(
            res.ok ? "Invalid server response" : `Server error (${res.status})`
          );
        }
      }
      if (!res.ok || !data.route) {
        throw new Error(data.error ?? `Could not generate CodeCast (${res.status})`);
      }
      router.push(data.route);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate CodeCast");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className={cn(
          buttonVariants({ className: "min-h-12 rounded-full px-6 text-sm" }),
          pending && "opacity-70",
          className
        )}
      >
        {pending ? "Generating CodeCast..." : label}
      </button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
