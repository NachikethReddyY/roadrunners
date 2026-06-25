import { CheckCircle2, CircleDot, FlaskConical } from "lucide-react";
import type { CoverageItem, CoverageState } from "@/lib/journey/presentation";
import { cn } from "@/lib/utils";

export type CoverageSummaryProps = {
  items: CoverageItem[];
  compact?: boolean;
  className?: string;
};

const stateMeta: Record<
  CoverageState,
  { label: string; icon: typeof CircleDot; className: string }
> = {
  introduced: {
    label: "Introduced",
    icon: CircleDot,
    className: "border-[var(--link)]/30 bg-blue-50 text-[var(--link)] dark:bg-blue-950/30",
  },
  practiced: {
    label: "Practiced",
    icon: FlaskConical,
    className: "border-primary/30 bg-[var(--primary-soft)] text-primary",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "border-[var(--semantic-success)]/30 bg-emerald-50 text-[var(--semantic-success)] dark:bg-emerald-950/30",
  },
};

export function CoverageSummary({
  items,
  compact = false,
  className,
}: CoverageSummaryProps) {
  if (items.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Coverage appears as you use guides, practice, and verify checkpoint outcomes.
      </p>
    );
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-3">
          <h2 className="font-heading text-lg font-semibold">Coverage</h2>
          <p className="text-sm text-muted-foreground">
            Describes exposure and evidence. It is not a mastery or certification claim.
          </p>
        </div>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="Concept coverage">
        {items.map((item) => {
          const meta = stateMeta[item.state];
          const Icon = meta.icon;
          return (
            <li
              key={`${item.concept}:${item.state}`}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                meta.className
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              <span>{item.concept}</span>
              <span aria-hidden>·</span>
              <span>{meta.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
