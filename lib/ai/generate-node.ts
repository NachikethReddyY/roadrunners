import OpenAI from "openai";
import { aiNodeOutputSchema, type AiNodeOutput } from "@/lib/schemas/ai";

export type GenerateNodeContext = {
  goal: string;
  interests: string[];
  recentNodes: Array<{ title: string; skill_tag: string }>;
  pivotSkill?: string;
};

export async function generateNextNode(
  context: GenerateNodeContext
): Promise<AiNodeOutput> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI is not configured");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You create concise, encouraging learning journey steps. Return only JSON matching the supplied schema. Keep content practical and safe for plain-text rendering.",
      },
      {
        role: "user",
        content: JSON.stringify(context),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "learning_journey_node",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "content_md", "skill_tag", "node_type", "choices"],
          properties: {
            title: { type: "string" },
            content_md: { type: "string" },
            skill_tag: { type: "string" },
            node_type: { type: "string", enum: ["lesson", "choice"] },
            choices: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "description", "target_skill_tag"],
                properties: {
                  label: { type: "string" },
                  description: { type: "string" },
                  target_skill_tag: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI returned an empty response");

  return aiNodeOutputSchema.parse(JSON.parse(content));
}
