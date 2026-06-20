export type JourneyProgress = {
  completed: number;
  total: number;
  percent: number;
  label: string;
};

export function computeJourneyProgress(
  nodeCount: number,
  decisionCount: number
): JourneyProgress {
  const total = Math.max(nodeCount, 1);
  const completed = Math.min(decisionCount, total);
  const percent = Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percent,
    label: total > 0 ? `Step ${completed} of ${total}` : "Not started",
  };
}
