import type { SkillBubble } from "@/lib/schemas/roadmap";
import { defaultSubjectForMode, type GoalMode } from "@/lib/roadmap/goal-placeholders";

const TARGET_BUBBLE_COUNT = 16;

const CORE_SLUGS = new Set([
  "react",
  "typescript",
  "javascript",
  "swift",
  "sql",
  "nextjs",
  "python-data",
  "docker",
]);

const BECOME_PROFILES: Array<{ match: RegExp; slugs: string[] }> = [
  {
    match: /data scientist|data science/i,
    slugs: ["sql", "python-data", "analytics", "ml-basics", "git", "javascript"],
  },
  {
    match: /ai engineer|artificial intelligence/i,
    slugs: ["ml-basics", "prompt-engineering", "llm-apps", "python-data", "javascript", "apis"],
  },
  {
    match: /vibe coder|vibe coding/i,
    slugs: ["react", "typescript", "nextjs", "javascript", "prompt-engineering", "git", "apis"],
  },
  {
    match: /ml engineer|machine learning engineer/i,
    slugs: ["ml-basics", "python-data", "prompt-engineering", "llm-apps", "git", "sql"],
  },
  {
    match: /product designer|ux designer|designer/i,
    slugs: ["html", "css", "javascript", "react", "analytics", "git"],
  },
  {
    match: /ios|swift|iphone|mobile app|android|kotlin|react native/i,
    slugs: ["swift", "kotlin", "react-native", "git", "apis", "javascript", "typescript"],
  },
  {
    match: /full[- ]?stack|web dev|frontend|backend|hireable|software engineer/i,
    slugs: ["react", "typescript", "nextjs", "javascript", "apis", "git", "docker", "html", "css"],
  },
  {
    match: /data|analyst|sql|analytics|python/i,
    slugs: ["sql", "python-data", "analytics", "git", "ml-basics", "javascript"],
  },
  {
    match: /ai|ml|llm|machine learning|prompt/i,
    slugs: ["ml-basics", "prompt-engineering", "llm-apps", "python-data", "javascript", "apis"],
  },
  {
    match: /devops|infra|cloud|deploy/i,
    slugs: ["docker", "cicd", "git", "apis"],
  },
];

const LEARN_DEFAULT = [
  "react",
  "typescript",
  "javascript",
  "nextjs",
  "swift",
  "sql",
  "docker",
  "prompt-engineering",
  "ml-basics",
  "git",
  "apis",
  "analytics",
  "html",
  "css",
  "python-data",
  "llm-apps",
];

const BECOME_DEFAULT = [
  "react",
  "typescript",
  "swift",
  "sql",
  "nextjs",
  "docker",
  "javascript",
  "ml-basics",
  "python-data",
  "git",
  "kotlin",
  "llm-apps",
  "apis",
  "analytics",
  "prompt-engineering",
  "html",
];

function pickBySlugs(catalog: SkillBubble[], slugs: string[]): SkillBubble[] {
  const map = new Map(catalog.map((s) => [s.slug, s]));
  return slugs.map((slug) => map.get(slug)).filter(Boolean) as SkillBubble[];
}

function expandSkillSet(
  catalog: SkillBubble[],
  primarySlugs: string[],
  target = TARGET_BUBBLE_COUNT
): SkillBubble[] {
  const primary = pickBySlugs(catalog, primarySlugs);
  const seen = new Set(primary.map((s) => s.slug));
  const categories = new Set(primary.map((s) => s.category));

  const related = catalog.filter(
    (s) => !seen.has(s.slug) && s.slug !== "explore" && categories.has(s.category)
  );
  const remainder = catalog.filter(
    (s) => !seen.has(s.slug) && s.slug !== "explore" && !categories.has(s.category)
  );

  const merged = [...primary, ...related, ...remainder];
  return merged.slice(0, target);
}

function matchBecomeProfile(text: string): string[] | null {
  for (const profile of BECOME_PROFILES) {
    if (profile.match.test(text)) return profile.slugs;
  }
  return null;
}

function matchLearnKeywords(text: string, catalog: SkillBubble[]): SkillBubble[] {
  const lower = text.toLowerCase();
  const matched = catalog.filter((skill) => {
    const name = skill.name.toLowerCase();
    const slug = skill.slug.toLowerCase();
    return lower.includes(name) || lower.includes(slug.replace(/-/g, " "));
  });
  if (matched.length >= 4) {
    return expandSkillSet(
      catalog,
      matched.map((s) => s.slug),
      TARGET_BUBBLE_COUNT
    );
  }
  return [];
}

export function filterSkillsForGoal(
  catalog: SkillBubble[],
  mode: GoalMode,
  subject: string
): SkillBubble[] {
  const trimmed = subject.trim();
  const context = trimmed || defaultSubjectForMode(mode);

  if (mode === "become") {
    const profileSlugs = matchBecomeProfile(context);
    if (profileSlugs) return expandSkillSet(catalog, profileSlugs);
    return expandSkillSet(catalog, BECOME_DEFAULT);
  }

  const keywordMatches = trimmed ? matchLearnKeywords(trimmed, catalog) : [];
  if (keywordMatches.length > 0) return keywordMatches;

  return expandSkillSet(catalog, LEARN_DEFAULT);
}

export function filterKeyForGoal(mode: GoalMode, subject: string): string {
  return `${mode}:${subject.trim().toLowerCase()}`;
}

export function isCoreSkill(slug: string): boolean {
  return CORE_SLUGS.has(slug);
}

export type BubbleVisualMeta = {
  scale: number;
  opacity: number;
  depth: number;
  priority: "core" | "normal" | "ambient";
};

export function bubbleVisualMeta(slug: string, index: number): BubbleVisualMeta {
  const seed = slug.split("").reduce((n, c) => n + c.charCodeAt(0), 0) + index * 17;
  const isCore = CORE_SLUGS.has(slug);
  const depth = seed % 3;

  const scale = isCore
    ? 1.02 + (seed % 10) / 100
    : 0.94 + (seed % 14) / 100;

  const opacity = 0.9 + (seed % 11) / 100;

  return {
    scale,
    opacity: Math.min(opacity, 1),
    depth,
    priority: isCore ? "core" : "normal",
  };
}
