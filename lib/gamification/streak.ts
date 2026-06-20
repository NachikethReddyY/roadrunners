export function shouldIncrementStreak(
  lastActivityAt: string | null,
  now: Date = new Date()
): boolean {
  if (!lastActivityAt) return true;

  const last = new Date(lastActivityAt);
  const lastDay = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (today === lastDay) return false;
  if (today - lastDay === 86400000) return true;
  return true;
}

export function nextStreakDays(
  lastActivityAt: string | null,
  currentStreak: number,
  now: Date = new Date()
): number {
  if (!lastActivityAt) return 1;

  const last = new Date(lastActivityAt);
  const lastDay = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (today === lastDay) return currentStreak;
  if (today - lastDay === 86400000) return currentStreak + 1;
  return 1;
}
