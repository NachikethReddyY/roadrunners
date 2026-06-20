import type { AiNodeOutput } from "@/lib/schemas/ai";

export function getFallbackNode(skillTag = "explore"): AiNodeOutput {
  return {
    title: "Explore your next step",
    content_md:
      "The AI path is temporarily unavailable. Here is a suggested starting point — pick a direction below and we will build your journey from here.",
    skill_tag: skillTag,
    node_type: "choice",
    choices: [
      {
        label: "Learn React basics",
        description: "Components, JSX, and props",
        target_skill_tag: "react",
      },
      {
        label: "Try TypeScript fundamentals",
        description: "Types, interfaces, and narrowing",
        target_skill_tag: "typescript",
      },
      {
        label: "Understand HTTP & APIs",
        description: "REST, JSON, and fetch",
        target_skill_tag: "apis",
      },
    ],
  };
}
