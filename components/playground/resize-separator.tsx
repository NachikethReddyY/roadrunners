"use client";

import { Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

type ResizeSeparatorProps = {
  orientation: "horizontal" | "vertical";
  className?: string;
};

/** Draggable grip between panels — wide hit target so resize actually works. */
export function ResizeSeparator({
  orientation,
  className,
}: ResizeSeparatorProps) {
  const vertical = orientation === "vertical";

  return (
    <Separator
      className={cn(
        "relative z-[60] shrink-0 touch-none bg-[var(--editor-surface-muted)]",
        vertical
          ? "flex h-6 w-full cursor-row-resize items-center justify-center"
          : "flex w-6 cursor-col-resize items-center justify-center",
        "hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/20",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none rounded-full bg-[var(--editor-text-muted)]/35",
          vertical ? "h-1 w-20" : "h-20 w-1"
        )}
        aria-hidden
      />
    </Separator>
  );
}
