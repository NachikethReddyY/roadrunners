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
  const total = Math.max(nodeCount, 0);
  const completed = Math.min(decisionCount, total);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percent,
    label:
      total > 0
        ? `${completed} of ${total} checkpoint${total === 1 ? "" : "s"} recorded`
        : "Waiting for the first checkpoint",
  };
}
