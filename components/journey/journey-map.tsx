import { Archive, Check, Circle, MapPin } from "lucide-react";
import { CoverageSummary } from "@/components/coverage/coverage-summary";
import type {
  JourneyMapNode,
} from "@/lib/journey/frontier-view";
import { cn } from "@/lib/utils";

export type MapNode = JourneyMapNode;

type JourneyMapProps = {
  nodes: MapNode[];
  className?: string;
};

const stateMeta: Record<
  MapNode["state"],
  { label: string; icon: typeof Check; markerClass: string }
> = {
  complete: {
    label: "Completed",
    icon: Check,
    markerClass: "border-[var(--semantic-success)] bg-[var(--semantic-success)] text-white",
  },
  current: {
    label: "Current",
    icon: MapPin,
    markerClass: "border-primary bg-primary text-white ring-4 ring-primary/15",
  },
  future: {
    label: "Future",
    icon: Circle,
    markerClass: "border-border bg-background text-muted-foreground",
  },
  archived: {
    label: "Archived branch",
    icon: Archive,
    markerClass: "border-muted-foreground/50 bg-background text-muted-foreground",
  },
};

function depthForNode(node: MapNode, byId: Map<string, MapNode>): number {
  let depth = 0;
  let parentId = node.parentId;
  const visited = new Set<string>();
  while (parentId && byId.has(parentId) && !visited.has(parentId)) {
    visited.add(parentId);
    depth += 1;
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return Math.min(depth, 4);
}

export function JourneyMap({ nodes, className }: JourneyMapProps) {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  return (
    <ol className={cn("space-y-3", className)} aria-label="Roadmap checkpoints">
      {nodes.map((node) => {
        const meta = stateMeta[node.state];
        const Icon = meta.icon;
        const depth = depthForNode(node, byId);
        return (
          <li
            key={node.id}
            className="relative"
            style={{ marginInlineStart: `${Math.min(depth * 20, 80)}px` }}
          >
            {node.parentId && (
              <span
                aria-hidden
                className="absolute -left-3 top-0 h-6 w-3 rounded-bl-lg border-b border-l border-border"
              />
            )}
            <div
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                node.state === "current" && "border-primary/40",
                node.state === "archived" && "border-dashed bg-muted/35"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border",
                    meta.markerClass
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="sr-only">{meta.label}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className={cn(
                        "font-heading text-base font-semibold",
                        node.state === "archived" && "text-muted-foreground"
                      )}
                    >
                      {node.title}
                    </h2>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
                      {node.mode}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {node.skillTag}
                    {node.completionBasis === "objective" && " · Objective verification"}
                    {node.completionBasis === "user_confirmed" && " · User-confirmed"}
                    {node.completionBasis === "acknowledged" && " · Recorded activity"}
                  </p>
                  {node.coverage.length > 0 && (
                    <CoverageSummary items={node.coverage} compact className="mt-3" />
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
