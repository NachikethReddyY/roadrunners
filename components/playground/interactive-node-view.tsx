"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChoicePanel } from "@/components/journey/choice-panel";
import { ContinueForm } from "@/components/journey/continue-form";
import {
  isCompletionMet,
  PlaygroundShell,
} from "@/components/playground/playground-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveWorkspaceSnapshot } from "@/lib/actions/workspace";
import type { PlaygroundConfig } from "@/lib/schemas/playground";
import { cn } from "@/lib/utils";

type Choice = {
  id: string;
  label: string;
  description: string | null;
  target_skill_tag: string;
};

type Skill = { slug: string; name: string; category: string };

type InteractiveNodeViewProps = {
  journeyId: string;
  nodeId: string;
  title: string;
  contentMd: string;
  skillTag: string;
  skillCategory: string;
  fallback?: boolean;
  playground: PlaygroundConfig;
  choices: Choice[];
  skills: Skill[];
  decided: boolean;
  initialFiles?: Record<string, string>;
};

const skillBadgeClass: Record<string, string> = {
  web: "bg-[var(--skill-web)] text-[var(--ink-warm)]",
  mobile: "bg-[var(--skill-mobile)] text-[var(--ink-warm)]",
  data: "bg-[var(--skill-data)] text-[var(--ink-warm)]",
  ai: "bg-[var(--skill-ai)] text-[var(--ink-warm)]",
  devops: "bg-[var(--skill-devops)] text-white",
  explore: "bg-[var(--skill-explore)] text-[var(--ink-warm)]",
};

export function InteractiveNodeView(props: InteractiveNodeViewProps) {
  const [output, setOutput] = useState("");
  const canContinue = isCompletionMet(props.playground, output);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playgroundConfig: PlaygroundConfig = {
    ...props.playground,
    files: props.initialFiles ?? props.playground.files,
  };

  const debouncedSave = useCallback(
    (files: Record<string, string>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveWorkspaceSnapshot({
          journeyId: props.journeyId,
          nodeId: props.nodeId,
          files,
        });
      }, 1500);
    },
    [props.journeyId, props.nodeId]
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 bg-card shadow-[0_10px_30px_rgba(29,29,31,0.05)]">
        <CardHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge
              className={cn(
                "rounded-full uppercase tracking-wider",
                skillBadgeClass[props.skillCategory] ?? skillBadgeClass.explore
              )}
            >
              {props.skillTag}
            </Badge>
            {props.fallback && (
              <Badge
                variant="outline"
                className="rounded-full uppercase tracking-wider text-[var(--semantic-warning)]"
              >
                Suggested path
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {props.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral max-w-none text-[17px] leading-[1.47] dark:prose-invert">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {props.contentMd}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3" aria-label="Practice workspace">
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Practice Workspace
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The editor and exercise live here as a separate hands-on step from the reading above.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            Exercise
          </Badge>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--editor-border)] bg-[var(--surface-dark)] shadow-[0_18px_48px_rgba(29,29,31,0.08)]">
          <PlaygroundShell
            config={playgroundConfig}
            title={props.title}
            journeyId={props.journeyId}
            nodeId={props.nodeId}
            skillTag={props.skillTag}
            onOutput={setOutput}
            onFilesChange={debouncedSave}
          />
        </div>
      </section>

      <div className="space-y-3 border-t border-border pt-6">
        {props.choices.length > 0 ? (
          <ChoicePanel
            journeyId={props.journeyId}
            nodeId={props.nodeId}
            choices={props.choices}
            skills={props.skills}
            decided={props.decided}
          />
        ) : (
          !props.decided &&
          (canContinue ? (
            <ContinueForm journeyId={props.journeyId} nodeId={props.nodeId} />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Run your code to match the expected output, then continue.
            </p>
          ))
        )}
      </div>
    </div>
  );
}
