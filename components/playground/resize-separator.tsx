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
        "relative z-[60] shrink-0 touch-none bg-[#1a1916]",
        vertical
          ? "flex h-5 w-full cursor-row-resize items-center justify-center"
          : "flex w-5 cursor-col-resize items-center justify-center",
        "hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/20",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none rounded-full bg-[var(--on-dark-mute)]/40",
          vertical ? "h-1 w-20" : "h-20 w-1"
        )}
        aria-hidden
      />
    </Separator>
  );
}
