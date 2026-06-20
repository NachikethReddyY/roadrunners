import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
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
  children?: React.ReactNode;
};

export function JourneyNodeCard({
  title,
  content,
  skillTag,
  skillCategory = "web",
  fallback,
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
      </CardHeader>
      <CardContent>
        <div className="prose prose-neutral max-w-none text-[17px] leading-[1.47] tracking-[-0.01em] dark:prose-invert">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
        </div>
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
        <p className="text-muted-foreground">Create your first AI-guided learning path.</p>
        <Link href={ROUTES.roadmapNew} className={buttonVariants({ className: "h-11 rounded-full px-6" })}>
          Create roadmap
        </Link>
      </CardContent>
    </Card>
  );
}
