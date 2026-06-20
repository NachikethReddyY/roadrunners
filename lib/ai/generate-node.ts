import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { getAiConfig, isAiConfigured, type AiConfig } from "@/lib/ai/config";
import { aiNodeOutputSchema, type AiNodeOutput } from "@/lib/schemas/ai";

export type GenerateNodeContext = {
  goal: string;
  interests: string[];
  recentNodes: Array<{ title: string; skill_tag: string }>;
  pivotSkill?: string;
  skillTags: string[];
};

const SYSTEM_PROMPT = `You are RoadRunners, an AI career learning guide for a gamified learning journey app.

Generate the next journey node as JSON only. The learner is exploring breadth-first skills toward employability — not a fixed curriculum.

Rules:
- Write concise, encouraging markdown (2–4 short paragraphs max) in content_md.
- skill_tag must be one of the provided catalog slugs, or "explore" if branching broadly.
- node_type is usually "choice" with 2–3 choices; use "lesson" only for a pure reading step with follow-up choices.
- Each choice needs label, optional description (under 120 chars), and target_skill_tag from the catalog.
- If pivot_skill is set, center the node on that skill and acknowledge the track change.
- Avoid repeating recent node titles; advance the journey naturally.`;

const nodeResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    content_md: { type: SchemaType.STRING },
    skill_tag: { type: SchemaType.STRING },
    node_type: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["lesson", "choice"],
    },
    choices: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          target_skill_tag: { type: SchemaType.STRING },
        },
        required: ["label", "target_skill_tag"],
      },
    },
  },
  required: ["title", "content_md", "skill_tag", "node_type", "choices"],
};

export { isAiConfigured };

function buildUserPrompt(context: GenerateNodeContext): string {
  const recent =
    context.recentNodes.length > 0
      ? context.recentNodes
          .map((n) => `- ${n.title} (${n.skill_tag})`)
          .join("\n")
      : "(none — this is the first node)";

  return [
    `Goal: ${context.goal || "Become hireable in tech"}`,
    `Interests: ${context.interests.join(", ") || "general tech"}`,
    `Skill catalog slugs: ${context.skillTags.join(", ")}`,
    `Recent nodes:\n${recent}`,
    context.pivotSkill ? `Pivot to skill: ${context.pivotSkill}` : "",
    "Generate the next node JSON.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateWithGemini(
  config: AiConfig,
  context: GenerateNodeContext
): Promise<AiNodeOutput> {
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: nodeResponseSchema,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(buildUserPrompt(context));
  const text = result.response.text();
  if (!text) throw new Error("AI returned an empty response");
  return aiNodeOutputSchema.parse(JSON.parse(text));
}

async function generateWithOpenAI(
  config: AiConfig,
  context: GenerateNodeContext
): Promise<AiNodeOutput> {
  const client = new OpenAI({ apiKey: config.apiKey });
  const response = await client.chat.completions.create({
    model: config.model,
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
  if (!content) throw new Error("AI returned an empty response");
  return aiNodeOutputSchema.parse(JSON.parse(content));
}

export async function generateNextNode(
  context: GenerateNodeContext
): Promise<AiNodeOutput> {
  const config = getAiConfig();
  if (!config) {
    throw new Error("Chikky AI is not configured — set CHIKKY_AI_API_KEY");
  }

  if (config.provider === "openai") {
    return generateWithOpenAI(config, context);
  }

  return generateWithGemini(config, context);
}
