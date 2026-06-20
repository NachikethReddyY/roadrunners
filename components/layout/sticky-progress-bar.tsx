import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { xpProgressInLevel, XP_PER_LEVEL } from "@/lib/gamification/xp";
import { cn } from "@/lib/utils";

type StickyProgressBarProps = {
  level: number;
  xp: number;
  streakDays: number;
  className?: string;
};

export function StickyProgressBar({
  level,
  xp,
  streakDays,
  className,
}: StickyProgressBarProps) {
  const progress = (xpProgressInLevel(xp) / XP_PER_LEVEL) * 100;

  return (
    <div
      className={cn(
        "border-b border-border bg-[color-mix(in_oklch,var(--canvas-parchment)_80%,transparent)] backdrop-blur-md dark:bg-[color-mix(in_oklch,var(--surface-dark)_90%,transparent)]",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="rounded-full uppercase tracking-wider">
          Level {level}
        </Badge>
        <Progress value={progress} className="h-2 flex-1 rounded-full" />
        <Badge variant="outline" className="rounded-full uppercase tracking-wider">
          <span className="hidden sm:inline">{streakDays} day streak</span>
          <span className="sm:hidden">🔥 {streakDays}</span>
        </Badge>
      </div>
    </div>
  );
}
