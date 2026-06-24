"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type XpToastProps = {
  xpGain?: number;
};

export function XpToast({ xpGain }: XpToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!xpGain || xpGain <= 0) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [xpGain]);

  if (!visible || !xpGain) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-28 left-1/2 z-50 -translate-x-1/2",
        "rounded-full border border-primary/30 bg-primary/15 px-5 py-2.5",
        "text-sm font-semibold text-primary shadow-lg backdrop-blur-md",
        "animate-in fade-in slide-in-from-bottom-4 duration-300"
      )}
    >
      +{xpGain} XP
    </div>
  );
}
