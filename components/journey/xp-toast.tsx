import { cn } from "@/lib/utils";

type XpToastProps = {
  xpGain?: number;
};

export function XpToast({ xpGain }: XpToastProps) {
  if (!xpGain || xpGain <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border border-primary/30",
        "bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
      )}
    >
      +{xpGain} XP recorded
    </div>
  );
}
