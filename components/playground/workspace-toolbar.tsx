"use client";

import { Columns2, Lightbulb, Loader2, PanelRight, Play, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RuntimeStatus } from "@/lib/playground/execute";

type WorkspaceToolbarProps = {
  title?: string;
  breadcrumb?: string;
  template?: string;
  running?: boolean;
  runtimeStatus?: RuntimeStatus;
  runDisabled?: boolean;
  splitEnabled?: boolean;
  terminalVisible?: boolean;
  explorerVisible?: boolean;
  coachOpen?: boolean;
  readOnly?: boolean;
  onRun?: () => void;
  onToggleSplit?: () => void;
  onToggleTerminal?: () => void;
  onToggleExplorer?: () => void;
  onToggleCoach?: () => void;
};

const runtimeLabel: Record<RuntimeStatus, string> = {
  loading: "Loading…",
  ready: "Ready",
  offline: "Offline",
  running: "Running",
};

export function WorkspaceToolbar({
  title,
  breadcrumb,
  template,
  running,
  runtimeStatus = "loading",
  runDisabled,
  splitEnabled,
  terminalVisible,
  explorerVisible,
  coachOpen,
  onRun,
  onToggleSplit,
  onToggleTerminal,
  onToggleExplorer,
  onToggleCoach,
}: WorkspaceToolbarProps) {
  const status = running ? "running" : runtimeStatus;

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--editor-border)] bg-[var(--surface-dark)] px-2 sm:gap-3 sm:px-3">
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <p className="truncate text-[10px] font-medium uppercase tracking-widest text-[var(--editor-text-muted)]">
            {breadcrumb}
          </p>
        )}
        {title && (
          <p className="truncate font-heading text-sm font-semibold text-[var(--editor-text)]">
            {title}
          </p>
        )}
      </div>

      <span
        className={cn(
          "hidden items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] sm:inline-flex",
          status === "ready" && "bg-emerald-500/10 text-emerald-300",
          status === "offline" && "bg-red-500/10 text-red-300",
          status === "running" && "bg-[var(--primary)]/15 text-[var(--primary-soft)]",
          status === "loading" && "bg-amber-500/10 text-amber-200"
        )}
      >
        {status === "running" && (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        )}
        {runtimeLabel[status]}
      </span>

      <div className="flex items-center gap-1">
        {template && (
          <span className="hidden rounded-md border border-[var(--hairline-warm)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--on-dark-mute)] md:inline">
            {template}
          </span>
        )}

        <button
          type="button"
          onClick={onToggleExplorer}
          aria-pressed={explorerVisible}
          aria-label={explorerVisible ? "Hide explorer" : "Show explorer"}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg lg:hidden",
            explorerVisible
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)]"
          )}
        >
          <PanelRight className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggleSplit}
          aria-pressed={splitEnabled}
          aria-label={splitEnabled ? "Close split view" : "Open split view"}
          className={cn(
            "hidden size-9 items-center justify-center rounded-lg sm:flex",
            splitEnabled
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)]"
          )}
        >
          <Columns2 className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggleTerminal}
          aria-pressed={terminalVisible}
          aria-label={terminalVisible ? "Hide terminal" : "Show terminal"}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            terminalVisible
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)]"
          )}
        >
          <Terminal className="size-4" />
        </button>

        {onToggleCoach && (
          <button
            type="button"
            onClick={onToggleCoach}
            aria-pressed={coachOpen}
            aria-label={coachOpen ? "Hide Teach Me coach" : "Show Teach Me coach"}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              coachOpen
                ? "bg-amber-400/15 text-amber-200"
                : "text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)]"
            )}
          >
            <Lightbulb className="size-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onRun}
          disabled={runDisabled || running}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg px-3",
            "bg-[var(--primary)] text-xs font-semibold text-white",
            "hover:bg-[var(--primary-active)] disabled:opacity-50",
            running && "animate-pulse"
          )}
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {running ? "Running" : "Run"}
        </button>
      </div>
    </div>
  );
}
