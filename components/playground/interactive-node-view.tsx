"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useState } from "react";
import { ChoicePanel } from "@/components/journey/choice-panel";
import { ContinueForm } from "@/components/journey/continue-form";
import {
  isCompletionMet,
  PlaygroundShell,
} from "@/components/playground/playground-shell";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
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
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {props.title}
        </h1>
        <div className="prose prose-neutral max-w-none text-[17px] leading-[1.47] dark:prose-invert">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {props.contentMd}
          </ReactMarkdown>
        </div>
      </div>

      <PlaygroundShell
        config={props.playground}
        title={props.title}
        onOutput={setOutput}
      />

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
