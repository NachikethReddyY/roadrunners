import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { GuidePanel } from "@/components/guide/guide-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import type { CheckpointMode } from "@/lib/journey/presentation";
import { cn } from "@/lib/utils";

const skillBadgeClass: Record<string, string> = {
  web: "bg-[var(--skill-web)] text-[var(--ink-warm)]",
  mobile: "bg-[var(--skill-mobile)] text-[var(--ink-warm)]",
  data: "bg-[var(--skill-data)] text-[var(--ink-warm)]",
  ai: "bg-[var(--skill-ai)] text-[var(--ink-warm)]",
  devops: "bg-[var(--skill-devops)] text-white",
  explore: "bg-[var(--skill-explore)] text-[var(--ink-warm)]",
};

type JourneyNodeCardProps = {
  title: string;
  content: string;
  skillTag: string;
  skillCategory?: string;
  fallback?: boolean;
  mode?: CheckpointMode;
  scrimHref?: string;
  children?: React.ReactNode;
};

export function JourneyNodeCard({
  title,
  content,
  skillTag,
  skillCategory = "web",
  fallback,
  mode = "guide",
  scrimHref,
  children,
}: JourneyNodeCardProps) {
  return (
    <Card className="rounded-xl border-border">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge
            className={cn(
              "rounded-full uppercase tracking-wider",
              skillBadgeClass[skillCategory] ?? skillBadgeClass.explore
            )}
          >
            {skillTag}
          </Badge>
          {fallback && (
            <Badge
              variant="outline"
              className="rounded-full uppercase tracking-wider text-[var(--semantic-warning)]"
            >
              Suggested path
            </Badge>
          )}
        </div>
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight">{title}</CardTitle>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {mode} checkpoint
        </p>
      </CardHeader>
      <CardContent>
        <GuidePanel
          markdown={content}
          goals={[mode === "choice" ? "Choose the next feature outcome." : `Complete “${title}”.`]}
          expectations={[
            mode === "build"
              ? "Use the guide, then author and run the implementation in your workspace."
              : "Review the context before acknowledging or choosing the next direction.",
          ]}
          hints={
            mode === "build"
              ? [
                  { level: 1, text: "Start with the smallest observable behavior in the goal." },
                  { level: 2, text: "Run after each meaningful change and inspect the output." },
                  { level: 3, text: "Compare the final behavior with the checkpoint requirement." },
                ]
              : []
          }
          scrimHref={scrimHref}
          className="border-0 bg-transparent p-0"
        />
      </CardContent>
      {children && (
        <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border pt-6">
          {children}
        </CardFooter>
      )}
    </Card>
  );
}

export function JourneyNodeSkeleton() {
  return (
    <Card className="rounded-xl border-border">
      <CardContent className="space-y-3 py-8">
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function EmptyJourneyCard() {
  return (
    <Card className="rounded-xl border-border py-8 text-center">
      <CardContent className="space-y-4">
        <Logo size="lg" className="mx-auto text-primary/50" />
        <p className="font-heading text-xl font-semibold">No roadmap yet</p>
        <p className="text-muted-foreground">
          Create a roadmap from a goal, then choose feature checkpoints as you build.
        </p>
        <Link href={ROUTES.roadmapNew} className={buttonVariants({ className: "h-11 rounded-full px-6" })}>
          Create roadmap
        </Link>
      </CardContent>
    </Card>
  );
}
