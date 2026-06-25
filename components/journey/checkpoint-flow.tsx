import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  Code2,
  GitBranch,
  Play,
} from "lucide-react";
import type { CheckpointMode } from "@/lib/journey/presentation";
import { cn } from "@/lib/utils";

type CheckpointFlowProps = {
  mode: CheckpointMode;
  hasScrim?: boolean;
  className?: string;
};

export function CheckpointFlow({ mode, hasScrim = false, className }: CheckpointFlowProps) {
  const stages =
    mode === "build"
      ? [
          { label: "Guide", icon: BookOpen },
          ...(hasScrim ? [{ label: "Optional scrim", icon: Clapperboard }] : []),
          { label: "Workspace", icon: Code2 },
          { label: "Run", icon: Play },
          { label: "Verify", icon: CheckCircle2 },
          { label: "Next choice", icon: GitBranch },
        ]
      : mode === "scrim"
        ? [
            { label: "Guide", icon: BookOpen },
            { label: "Open CodeCast", icon: Clapperboard },
            { label: "Watch", icon: Play },
            { label: "Try it", icon: Code2 },
            { label: "Continue", icon: GitBranch },
          ]
      : mode === "choice"
        ? [
            { label: "Context", icon: BookOpen },
            { label: "Choose", icon: GitBranch },
          ]
        : [
            { label: "Explore", icon: BookOpen },
            { label: "Acknowledge", icon: CheckCircle2 },
            { label: "Continue", icon: GitBranch },
          ];

  return (
    <ol
      className={cn(
        "flex snap-x gap-2 overflow-x-auto pb-2 text-xs text-muted-foreground",
        className
      )}
      aria-label="Checkpoint stages"
    >
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        return (
          <li key={stage.label} className="flex shrink-0 snap-start items-center gap-2">
            {index > 0 && <span aria-hidden className="text-border">→</span>}
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3">
              <Icon className="size-3.5" aria-hidden />
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
