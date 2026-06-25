"use client";

import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { BookOpen, ChevronDown, Clapperboard, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GuidePanelProps = {
  title?: string;
  markdown: string;
  goals?: string[];
  expectations?: string[];
  hints?: Array<{ level: 1 | 2 | 3; text: string }>;
  scrimHref?: string;
  className?: string;
};

export function GuidePanel({
  title = "Checkpoint guide",
  markdown,
  goals = [],
  expectations = [],
  hints = [],
  scrimHref,
  className,
}: GuidePanelProps) {
  const [visibleHints, setVisibleHints] = useState(0);

  return (
    <section
      aria-labelledby="checkpoint-guide-title"
      className={cn("rounded-xl border border-border bg-card p-5 sm:p-6", className)}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-[var(--primary-soft)] p-2 text-primary">
          <BookOpen className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Guide
          </p>
          <h2 id="checkpoint-guide-title" className="font-heading text-xl font-semibold">
            {title}
          </h2>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="mt-5 rounded-lg bg-[var(--canvas-parchment)] p-4 dark:bg-muted">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" aria-hidden />
            Goals
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {goals.map((goal) => (
              <li key={goal} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="prose prose-neutral mt-5 max-w-none text-[17px] leading-[1.47] dark:prose-invert">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
      </div>

      {expectations.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">What to expect</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {expectations.map((expectation) => (
              <li key={expectation}>— {expectation}</li>
            ))}
          </ul>
        </div>
      )}

      {hints.length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Progressive hints</h3>
              <p className="text-xs text-muted-foreground">
                Reveal only what you need; hints do not complete the work.
              </p>
            </div>
            {visibleHints < hints.length && (
              <button
                type="button"
                onClick={() => setVisibleHints((count) => count + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--link)]"
              >
                Reveal hint {visibleHints + 1}
                <ChevronDown className="size-4" aria-hidden />
              </button>
            )}
          </div>
          {visibleHints > 0 && (
            <ol className="mt-3 space-y-2">
              {hints.slice(0, visibleHints).map((hint) => (
                <li key={`${hint.level}:${hint.text}`} className="rounded-lg border border-border p-3 text-sm">
                  <span className="font-semibold">Hint {hint.level}:</span>{" "}
                  <span className="text-muted-foreground">{hint.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {scrimHref && (
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            A scrim can demonstrate the sequence. Its code is reference material; you still
            implement the feature in your own workspace.
          </p>
          <Link
            href={scrimHref}
            className={buttonVariants({
              variant: "outline",
              className: "h-11 shrink-0 rounded-full px-5",
            })}
          >
            <Clapperboard className="size-4" aria-hidden />
            Open scrim
          </Link>
        </div>
      )}
    </section>
  );
}
