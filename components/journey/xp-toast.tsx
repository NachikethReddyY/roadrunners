import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type XpToastProps = {
  xpGain?: number;
};

export function XpToast({ xpGain }: XpToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!xpGain || xpGain <= 0) return;
    const showTimer = window.setTimeout(() => setVisible(true), 0);
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(timer);
    };
  }, [xpGain]);

  if (!visible || !xpGain) return null;

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
