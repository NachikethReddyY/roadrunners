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
        "flex h-9 items-stretch overflow-x-auto bg-[var(--surface-dark)]",
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
              "group flex max-w-[12rem] shrink-0 items-center border-r border-[var(--editor-border)]/70",
              active
                ? "bg-[var(--editor-surface)] text-[var(--editor-text)]"
                : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface)]/60"
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
