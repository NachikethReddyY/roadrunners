"use client";

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { RuntimeStatus } from "@/lib/playground/execute";

type ConsolePaneProps = {
  lines: string[];
  status: RuntimeStatus;
  collapsed?: boolean;
  fullscreen?: boolean;
  prompt?: string;
  previewUrl?: string | null;
  onToggleCollapse?: () => void;
  onToggleFullscreen?: () => void;
  onHide?: () => void;
  onClear?: () => void;
  onSubmitLine?: (line: string) => void;
  className?: string;
};

const statusLabel: Record<RuntimeStatus, string> = {
  loading: "Loading runtimes…",
  ready: "Ready",
  offline: "Offline",
  running: "Running…",
};

export function ConsolePane({
  lines,
  status,
  collapsed = false,
  fullscreen = false,
  prompt = ">",
  previewUrl,
  onToggleCollapse,
  onToggleFullscreen,
  onHide,
  onClear,
  onSubmitLine,
  className,
}: ConsolePaneProps) {
  const isRunning = status === "running";
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, isRunning, input]);

  const submit = () => {
    const line = input.trim();
    if (!line || !onSubmitLine || isRunning) return;
    onSubmitLine(line);
    setInput("");
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-[var(--canvas-dark)]",
        isRunning && "ring-1 ring-inset ring-[var(--primary)]/50",
        className
      )}
    >
      {isRunning && (
        <div className="h-0.5 shrink-0 animate-pulse bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
      )}

      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--editor-border)] bg-[var(--surface-dark)] px-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--on-dark-mute)] hover:text-[var(--on-dark)]"
        >
          Terminal
          {collapsed ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>

        <div className="flex items-center gap-1">
          <StatusBadge status={status} />
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullscreen();
              }}
              aria-label={fullscreen ? "Exit terminal fullscreen" : "Terminal fullscreen"}
              className="rounded-md p-1.5 text-[var(--on-dark-mute)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--on-dark)]"
            >
              {fullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            aria-label="Clear terminal"
            className="rounded-md p-1.5 text-[var(--on-dark-mute)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--on-dark)]"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHide?.();
            }}
            aria-label="Hide terminal"
            className="rounded-md p-1.5 text-[var(--on-dark-mute)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--on-dark)]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 flex-1 overflow-auto px-3 py-2.5 font-mono text-[13px] leading-relaxed sm:text-sm",
          isRunning ? "text-[var(--primary-active)]" : "text-[var(--on-dark)]"
        )}
      >
        {!collapsed && (
          <>
            {isRunning && lines.length === 0 && (
              <div className="mb-1 inline-flex items-center gap-2 text-[var(--primary)]">
                <Loader2 className="size-3.5 animate-spin" />
                Executing…
              </div>
            )}
            {lines.length > 0 && (
              <pre className="m-0 cursor-text select-text whitespace-pre-wrap break-words">
                {lines.join("\n")}
              </pre>
            )}
          </>
        )}

        {previewUrl && !collapsed && (
          <div className="my-2 border-t border-[var(--editor-border)] pt-2">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--on-dark-mute)]">
              HTML preview
            </p>
            <iframe
              title="HTML preview"
              src={previewUrl}
              sandbox="allow-scripts"
              className="h-28 w-full rounded border border-[var(--editor-border)] bg-white"
            />
          </div>
        )}

        {onSubmitLine && (
          <div
            className="flex min-w-0 cursor-text items-baseline gap-1.5 pt-0.5"
            onClick={focusInput}
          >
            <span className="shrink-0 select-none text-[var(--primary)]">{prompt}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={isRunning}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-inherit text-inherit caret-[var(--primary)] outline-none"
              aria-label="Terminal input"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RuntimeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px]",
        status === "ready" && "bg-emerald-500/15 text-emerald-300",
        status === "offline" && "bg-red-500/15 text-red-300",
        status === "running" && "bg-[var(--primary)]/20 text-[var(--primary-soft)]",
        status === "loading" && "bg-amber-500/15 text-amber-200"
      )}
    >
      {status === "running" && (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      )}
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "ready" && "bg-emerald-400",
          status === "offline" && "bg-red-400",
          status === "running" && "animate-pulse bg-[var(--primary)]",
          status === "loading" && "animate-pulse bg-amber-400"
        )}
        aria-hidden
      />
      {statusLabel[status]}
    </span>
  );
}
