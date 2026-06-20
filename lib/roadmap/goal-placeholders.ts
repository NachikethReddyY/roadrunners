export const LEARN_PLACEHOLDERS = [
  "React",
  "SQL",
  "Swift",
  "prompt engineering",
  "Docker",
] as const;

export const BECOME_PLACEHOLDERS = [
  "data scientist",
  "AI engineer",
  "vibe coder",
  "full-stack developer",
  "ML engineer",
  "product designer",
] as const;

export type GoalMode = "learn" | "become";

export function placeholdersForMode(mode: GoalMode): readonly string[] {
  return mode === "learn" ? LEARN_PLACEHOLDERS : BECOME_PLACEHOLDERS;
}

export function defaultSubjectForMode(mode: GoalMode): string {
  return placeholdersForMode(mode)[0];
}
