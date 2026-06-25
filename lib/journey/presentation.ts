export type CheckpointMode = "guide" | "scrim" | "build" | "choice" | "milestone";

export type FeatureChoice = {
  id: string;
  title: string;
  description: string;
  targetSkillTag: string;
  estimatedMinutes?: number;
  concepts: string[];
  prerequisites?: string[];
  suggestedMode?: "guide" | "scrim" | "build";
  availability: "unlocked" | "deferred" | "locked";
  projectContribution: string;
  isPivot: boolean;
};

export type DerivedFrontier = {
  taken: string[];
  unlocked: string[];
  deferred: string[];
  locked: string[];
};

export type CoverageState = "introduced" | "practiced" | "verified";

export type CoverageItem = {
  concept: string;
  state: CoverageState;
};

export type Verdict = {
  runs: boolean;
  fulfills: boolean;
  reason: string;
  output?: string;
  objectiveFulfillment: "pass" | "fail" | "inconclusive";
  aiAdvisory?: {
    plausible: boolean;
    reason: string;
  };
  completionBasis?: "objective" | "user_confirmed";
  infrastructureError?: boolean;
};

export type ChoicePresentationInput = {
  id: string;
  label?: string | null;
  title?: string | null;
  description?: string | null;
  target_skill_tag?: string | null;
  targetSkillTag?: string | null;
  estimated_minutes?: number | null;
  estimatedMinutes?: number | null;
  concepts?: string[] | null;
  prerequisites?: string[] | null;
  suggested_mode?: "guide" | "scrim" | "build" | null;
  suggestedMode?: "guide" | "scrim" | "build" | null;
  availability?: "unlocked" | "deferred" | "locked" | null;
  project_contribution?: string | null;
  projectContribution?: string | null;
  is_pivot?: boolean | null;
  isPivot?: boolean | null;
};

const CONCEPT_PATTERNS: Array<[string, RegExp]> = [
  ["html-structure", /\b(html|markup|semantic)\b/i],
  ["css-layout", /\b(css|layout|flexbox|grid)\b/i],
  ["css-responsive", /\b(responsive|breakpoint|mobile-first)\b/i],
  ["dom", /\b(dom|document|element)\b/i],
  ["events", /\b(event|click|submit|listener)\b/i],
  ["functions", /\b(function|method)\b/i],
  ["callbacks", /\b(callback)\b/i],
  ["promises", /\b(promise)\b/i],
  ["async-await", /\b(async|await)\b/i],
  ["http", /\b(http|request|response|fetch)\b/i],
  ["routing", /\b(route|routing|navigation)\b/i],
  ["json", /\b(json)\b/i],
  ["rest", /\b(rest|api endpoint)\b/i],
  ["state-management", /\b(state|store|reducer)\b/i],
  ["error-handling", /\b(error|exception|fallback)\b/i],
  ["modules", /\b(module|import|export|package)\b/i],
  ["oop", /\b(class|object-oriented|inheritance)\b/i],
  ["closures", /\b(closure|scope)\b/i],
  ["caching", /\b(cache|caching)\b/i],
  ["auth", /\b(auth|login|session|oauth)\b/i],
  ["db-query", /\b(sql|database|query|postgres)\b/i],
  ["python-endpoint", /\b(python|flask|fastapi)\b/i],
  ["cors", /\b(cors)\b/i],
];

export function checkpointModeForNode(
  nodeType: string,
  hasWorkspace = false
): CheckpointMode {
  if (hasWorkspace || nodeType === "interactive") return "build";
  if (nodeType === "milestone") return "milestone";
  if (nodeType === "lesson") return "guide";
  if (nodeType === "scrim") return "scrim";
  return "choice";
}

export function inferConcepts(...textParts: Array<string | null | undefined>): string[] {
  const text = textParts.filter(Boolean).join(" ");
  const matches = CONCEPT_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(
    ([concept]) => concept
  );
  return matches.slice(0, 4);
}

export function projectContributionForChoice(input: {
  title: string;
  targetSkillTag: string;
  roadmapGoal: string;
  isPivot?: boolean;
}): string {
  const prefix = input.isPivot ? "Bring this field into the current project" : "Move the project forward";
  return `${prefix} by delivering “${input.title}” for ${input.roadmapGoal.toLowerCase()}.`;
}

export function presentFeatureChoices(
  rows: ChoicePresentationInput[],
  context: { roadmapGoal: string; currentSkillTag?: string }
): FeatureChoice[] {
  return rows.slice(0, 3).map((row) => {
    const title = row.title?.trim() || row.label?.trim() || "Choose this feature";
    const targetSkillTag =
      row.targetSkillTag?.trim() ||
      row.target_skill_tag?.trim() ||
      context.currentSkillTag ||
      "explore";
    const isPivot = row.isPivot ?? row.is_pivot ?? false;
    const concepts =
      row.concepts?.filter(Boolean).slice(0, 4) ??
      inferConcepts(title, row.description, targetSkillTag);

    return {
      id: row.id,
      title,
      description:
        row.description?.trim() ||
        `Build a concrete outcome that advances the ${targetSkillTag} part of this roadmap.`,
      targetSkillTag,
      estimatedMinutes: row.estimatedMinutes ?? row.estimated_minutes ?? 30,
      concepts,
      prerequisites: row.prerequisites?.filter(Boolean),
      suggestedMode: row.suggestedMode ?? row.suggested_mode ?? "build",
      availability: row.availability ?? "unlocked",
      projectContribution:
        row.projectContribution?.trim() ||
        row.project_contribution?.trim() ||
        projectContributionForChoice({
          title,
          targetSkillTag,
          roadmapGoal: context.roadmapGoal,
          isPivot,
        }),
      isPivot,
    };
  });
}

export function buildPivotChoices(
  skills: Array<{ slug: string; name: string; category?: string }>,
  context: { roadmapGoal: string; currentSkillTag?: string }
): FeatureChoice[] {
  const seenCategories = new Set<string>();
  const candidates = skills.filter((skill) => {
    if (skill.slug === context.currentSkillTag || skill.slug === "explore") return false;
    const category = skill.category ?? skill.slug;
    if (seenCategories.has(category)) return false;
    seenCategories.add(category);
    return true;
  });

  return candidates.slice(0, 3).map((skill) => {
    const title = `Add ${skill.name} to the project`;
    return {
      id: `pivot:${skill.slug}`,
      title,
      description: `Explore ${skill.name} through one scoped feature instead of abandoning your current work.`,
      targetSkillTag: skill.slug,
      estimatedMinutes: 45,
      concepts: inferConcepts(skill.name, skill.slug),
      suggestedMode: "build",
      availability: "unlocked",
      projectContribution: projectContributionForChoice({
        title,
        targetSkillTag: skill.slug,
        roadmapGoal: context.roadmapGoal,
        isPivot: true,
      }),
      isPivot: true,
    };
  });
}

export function canUserConfirmCompletion(verdict: Verdict | null | undefined): boolean {
  if (!verdict || verdict.infrastructureError || !verdict.runs) return false;
  return verdict.objectiveFulfillment === "inconclusive";
}

export function highestCoverageState(
  current: CoverageState | undefined,
  next: CoverageState
): CoverageState {
  const rank: Record<CoverageState, number> = {
    introduced: 0,
    practiced: 1,
    verified: 2,
  };
  return !current || rank[next] > rank[current] ? next : current;
}
