import type { AiNodeOutput } from "@/lib/schemas/ai";

export type GenerateNodeContext = {
  goal: string;
  interests: string[];
  recentNodes: Array<{ title: string; skill_tag: string }>;
  pivotSkill?: string;
};

export async function generateNextNode(
  _context: GenerateNodeContext
): Promise<AiNodeOutput> {
  throw new Error("AI provider not configured — use fallback in route handler");
}
