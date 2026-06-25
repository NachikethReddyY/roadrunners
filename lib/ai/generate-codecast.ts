import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { getAiConfig, type AiConfig } from "@/lib/ai/config";
import { generatedScrimSchema, type GeneratedScrim } from "@/lib/schemas/playground";

export type GenerateCodecastContext = {
  goal: string;
  journeyTitle: string;
  nodeTitle: string;
  nodeContent: string;
  skillTag: string;
  recentNodes: Array<{ title: string; skill_tag: string }>;
  playground?: {
    template: "vanilla" | "react-ts" | "python";
    files: Record<string, string>;
    preview?: boolean;
  } | null;
};

const CODECAST_SYSTEM_PROMPT = `You are RoadRunners, generating a Scrimba-style CodeCast lesson as JSON only.

Create a compact, practical coding lesson that teaches by showing code evolve over time.

Rules:
- Build around the learner's current checkpoint, not generic curriculum.
- Return title, skill_tag, template, initial_files, slides, timeline, narration, duration_ms.
- slides should be short teaching cards with clear titles and concise markdown.
- timeline.events may use only: files, focus, caption, slide, run, challenge.
- files events must show code progressively evolving toward the intended result.
- include at least 2 caption events and at least 1 run event.
- include 1 challenge event for hands-on practice when the skill is coding-related.
- narration.script should sound like a teacher reading the walkthrough naturally.
- narration.cues should align to timeline times.
- duration_ms should match the timeline length and remain under 120000.
- Keep the lesson achievable and concrete.`;

const generatedScrimResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    skill_tag: { type: SchemaType.STRING },
    template: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["vanilla", "react-ts", "python"],
    },
    initial_files: { type: SchemaType.OBJECT, properties: {} },
    slides: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          markdown: { type: SchemaType.STRING },
        },
        required: ["id", "title"],
      },
    },
    timeline: {
      type: SchemaType.OBJECT,
      properties: {
        durationMs: { type: SchemaType.NUMBER },
        events: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              t: { type: SchemaType.NUMBER },
              type: { type: SchemaType.STRING },
              files: { type: SchemaType.OBJECT, properties: {} },
              path: { type: SchemaType.STRING },
              text: { type: SchemaType.STRING },
              speech: { type: SchemaType.STRING },
              slideId: { type: SchemaType.STRING },
              id: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              instructions: { type: SchemaType.STRING },
              hint: { type: SchemaType.STRING },
            },
            required: ["t", "type"],
          },
        },
      },
      required: ["durationMs", "events"],
    },
    narration: {
      type: SchemaType.OBJECT,
      properties: {
        script: { type: SchemaType.STRING },
        cues: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              t: { type: SchemaType.NUMBER },
              text: { type: SchemaType.STRING },
            },
            required: ["t", "text"],
          },
        },
        next_session_topic: { type: SchemaType.STRING },
      },
      required: ["script", "cues"],
    },
    duration_ms: { type: SchemaType.NUMBER },
  },
  required: [
    "title",
    "skill_tag",
    "template",
    "initial_files",
    "slides",
    "timeline",
    "narration",
    "duration_ms",
  ],
};

function buildCodecastPrompt(context: GenerateCodecastContext): string {
  const recent =
    context.recentNodes.length > 0
      ? context.recentNodes.map((node) => `- ${node.title} (${node.skill_tag})`).join("\n")
      : "(none)";

  return [
    `Journey: ${context.journeyTitle}`,
    `Goal: ${context.goal}`,
    `Checkpoint title: ${context.nodeTitle}`,
    `Checkpoint skill: ${context.skillTag}`,
    `Checkpoint content:\n${context.nodeContent}`,
    `Recent nodes:\n${recent}`,
    context.playground
      ? `Starter workspace (${context.playground.template}):\n${JSON.stringify(
          context.playground.files,
          null,
          2
        )}`
      : "",
    "Generate one complete CodeCast JSON lesson for this checkpoint.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateWithGemini(
  config: AiConfig,
  context: GenerateCodecastContext
): Promise<GeneratedScrim> {
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: CODECAST_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: generatedScrimResponseSchema,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const result = await model.generateContent(buildCodecastPrompt(context));
  const text = result.response.text();
  if (!text) throw new Error("AI returned an empty CodeCast response");
  return generatedScrimSchema.parse(JSON.parse(text));
}

async function generateWithOpenAI(
  config: AiConfig,
  context: GenerateCodecastContext
): Promise<GeneratedScrim> {
  const client = new OpenAI({ apiKey: config.apiKey });
  const messages = [
    { role: "system" as const, content: CODECAST_SYSTEM_PROMPT },
    { role: "user" as const, content: buildCodecastPrompt(context) },
  ];

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_codecast",
          strict: false,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "title",
              "skill_tag",
              "template",
              "initial_files",
              "slides",
              "timeline",
              "narration",
              "duration_ms",
            ],
            properties: {
              title: { type: "string" },
              skill_tag: { type: "string" },
              template: { type: "string", enum: ["vanilla", "react-ts", "python"] },
              initial_files: {
                type: "object",
                additionalProperties: { type: "string" },
              },
              slides: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "title"],
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    markdown: { type: "string" },
                  },
                },
              },
              timeline: {
                type: "object",
                additionalProperties: false,
                required: ["durationMs", "events"],
                properties: {
                  durationMs: { type: "number" },
                  events: {
                    type: "array",
                    items: { type: "object" },
                  },
                },
              },
              narration: {
                type: "object",
                additionalProperties: false,
                required: ["script", "cues"],
                properties: {
                  script: { type: "string" },
                  cues: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["t", "text"],
                      properties: {
                        t: { type: "number" },
                        text: { type: "string" },
                      },
                    },
                  },
                  next_session_topic: { type: "string" },
                },
              },
              duration_ms: { type: "number" },
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("AI returned an empty CodeCast response");
    return generatedScrimSchema.parse(JSON.parse(content));
  } catch (structuredError) {
    const retry = await client.chat.completions.create({
      model: config.model,
      messages: [
        ...messages,
        {
          role: "user",
          content:
            "Return valid JSON only for the same CodeCast request. Keep the same shape and do not add commentary.",
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = retry.choices[0]?.message.content;
    if (!content) throw structuredError;
    return generatedScrimSchema.parse(JSON.parse(content));
  }
}

export async function generateCodecast(
  context: GenerateCodecastContext
): Promise<GeneratedScrim> {
  const config = getAiConfig();
  if (!config) {
    throw new Error("AI is not configured for CodeCast generation");
  }

  if (config.provider === "openai") {
    return generateWithOpenAI(config, context);
  }

  return generateWithGemini(config, context);
}
