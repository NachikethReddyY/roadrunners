"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type EditorTabsProps = {
  openTabs: string[];
  activeFile: string;
  onSelect: (path: string) => void;
  onClose?: (path: string) => void;
  className?: string;
};

export function EditorTabs({
  openTabs,
  activeFile,
  onSelect,
  onClose,
  className,
}: EditorTabsProps) {
  return (
    <div
      className={cn(
        "flex h-9 items-stretch overflow-x-auto bg-[#14130f]",
        className
      )}
      role="tablist"
    >
      {openTabs.map((path) => {
        const active = path === activeFile;
        return (
          <div
            key={path}
            role="presentation"
            className={cn(
              "group flex max-w-[12rem] shrink-0 items-center border-r border-[var(--hairline-warm)]/50",
              active
                ? "bg-[#1a1916] text-[var(--on-dark)]"
                : "text-[var(--on-dark-mute)] hover:bg-[#1a1916]/60"
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(path)}
              className="truncate px-3 py-2 font-mono text-xs"
            >
              {path}
            </button>
            {onClose && openTabs.length > 1 && (
              <button
                type="button"
                aria-label={`Close ${path}`}
                onClick={() => onClose(path)}
                className="mr-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--hairline-warm)] active:scale-90"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
