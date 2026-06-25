import {
  checkpointModeForNode,
  highestCoverageState,
  inferConcepts,
  type CheckpointMode,
  type CoverageItem,
  type CoverageState,
  type DerivedFrontier,
} from "@/lib/journey/presentation";

export type FrontierNodeInput = {
  id: string;
  title: string;
  parent_id?: string | null;
  parentId?: string | null;
  node_type?: string | null;
  nodeType?: string | null;
  skill_tag?: string | null;
  skillTag?: string | null;
  content_md?: string | null;
  archived_at?: string | null;
  archivedAt?: string | null;
  playground_config?: unknown;
};

export type JourneyMapNode = {
  id: string;
  parentId: string | null;
  title: string;
  skillTag: string;
  mode: CheckpointMode;
  state: "complete" | "current" | "future" | "archived";
  completionBasis?: "objective" | "user_confirmed" | "acknowledged";
  coverage: CoverageItem[];
};

export function buildFrontierView(input: {
  nodes: FrontierNodeInput[];
  currentNodeId: string | null;
  takenNodeIds: Iterable<string>;
  completionBasisByNode?: Map<string, "objective" | "user_confirmed" | "acknowledged">;
  coverageByNode?: Map<string, CoverageItem[]>;
}): { frontier: DerivedFrontier; nodes: JourneyMapNode[] } {
  const taken = new Set(input.takenNodeIds);
  const mapped = input.nodes.map((node): JourneyMapNode => {
    const archived = Boolean(node.archived_at ?? node.archivedAt);
    const completed = taken.has(node.id);
    const state: JourneyMapNode["state"] = archived
      ? "archived"
      : node.id === input.currentNodeId
        ? "current"
        : completed
          ? "complete"
          : "future";
    const skillTag = node.skillTag ?? node.skill_tag ?? "explore";
    const mode = checkpointModeForNode(
      node.nodeType ?? node.node_type ?? "choice",
      Boolean(node.playground_config)
    );
    const concepts = inferConcepts(node.title, node.content_md, skillTag);
    const inferredCoverageState: CoverageState =
      completed && mode === "build" ? "practiced" : "introduced";
    const inferredCoverage = state === "future"
      ? []
      : concepts.map((concept) => ({ concept, state: inferredCoverageState }));

    return {
      id: node.id,
      parentId: node.parentId ?? node.parent_id ?? null,
      title: node.title,
      skillTag,
      mode,
      state,
      completionBasis:
        input.completionBasisByNode?.get(node.id) ??
        (completed ? "acknowledged" : undefined),
      coverage: input.coverageByNode?.get(node.id) ?? inferredCoverage,
    };
  });

  return {
    frontier: {
      taken: mapped.filter((node) => taken.has(node.id)).map((node) => node.id),
      unlocked: mapped
        .filter((node) => node.state === "current" && !taken.has(node.id))
        .map((node) => node.id),
      deferred: mapped.filter((node) => node.state === "archived").map((node) => node.id),
      locked: mapped.filter((node) => node.state === "future").map((node) => node.id),
    },
    nodes: mapped,
  };
}

export function combineJourneyCoverage(nodes: JourneyMapNode[]): CoverageItem[] {
  const states = new Map<string, CoverageState>();
  for (const node of nodes) {
    for (const item of node.coverage) {
      states.set(item.concept, highestCoverageState(states.get(item.concept), item.state));
    }
  }
  return [...states].map(([concept, state]) => ({ concept, state }));
}
