import { cn } from "@/lib/utils";

const skillBubbleClass: Record<string, string> = {
  web: "skill-bubble-web",
  mobile: "skill-bubble-mobile",
  data: "skill-bubble-data",
  ai: "skill-bubble-ai",
  devops: "skill-bubble-devops",
  explore: "skill-bubble-explore",
};

export function skillBubbleCategoryClass(category: string): string {
  return skillBubbleClass[category] ?? skillBubbleClass.explore;
}

export function skillBubbleClasses(category: string, extra?: string): string {
  return cn(skillBubbleCategoryClass(category), extra);
}
