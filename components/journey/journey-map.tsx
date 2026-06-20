import { cn } from "@/lib/utils";

export type MapNode = {
  id: string;
  title: string;
  state: "complete" | "current" | "upcoming" | "archived";
};

type JourneyMapProps = {
  nodes: MapNode[];
  className?: string;
};

const dotClass: Record<MapNode["state"], string> = {
  complete: "size-3 rounded-full bg-[var(--semantic-success)]",
  current:
    "size-4 rounded-full bg-primary ring-2 ring-[var(--primary-soft)] ring-offset-2 ring-offset-background",
  upcoming: "size-3 rounded-full border-2 border-border bg-background",
  archived: "size-2.5 rounded-full border-2 border-muted-foreground/50 bg-transparent",
};

export function JourneyMap({ nodes, className }: JourneyMapProps) {
  return (
    <ol className={cn("space-y-3 border-l-2 border-border pl-4", className)}>
      {nodes.map((node) => (
        <li key={node.id} className="flex items-center gap-3">
          <span className={dotClass[node.state]} aria-hidden />
          <span
            className={cn(
              "text-sm",
              node.state === "current" && "font-semibold",
              node.state === "archived" && "text-muted-foreground line-through"
            )}
          >
            {node.title}
          </span>
        </li>
      ))}
    </ol>
  );
}
