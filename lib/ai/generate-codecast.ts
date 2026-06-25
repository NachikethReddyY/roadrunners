import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { getAiConfig, type AiConfig } from "@/lib/ai/config";
import { parseModelJson } from "@/lib/ai/parse-model-json";
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
- Every slide MUST include a unique string id (e.g. intro, variables, run).
- timeline.events may use only: files, focus, caption, slide, run, challenge.
- files events must show code progressively evolving toward the intended result.
- include at least 2 caption events and at least 1 run event.
- include 1 challenge event for hands-on practice when the skill is coding-related.
- narration.script should sound like a teacher reading the walkthrough naturally.
- narration.cues should align to timeline times.
- duration_ms should match the timeline length and remain under 120000.
- Keep the lesson achievable and concrete.
- Stay compact: at most 4 slides, at most 6 files timeline events, short code snippets.`;

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

function slugifyId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "slide"
  );
}

/** ponytail: naive repair for common LLM omissions — upgrade path is stricter schema + retry */
function normalizeGeneratedScrim(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const scrim = { ...(raw as Record<string, unknown>) };

  if (!scrim.initial_files || typeof scrim.initial_files !== "object") {
    scrim.initial_files = {};
  }

  if (Array.isArray(scrim.slides)) {
    const usedIds = new Set<string>();
    scrim.slides = scrim.slides.map((slide, index) => {
      if (!slide || typeof slide !== "object") return slide;
      const entry = { ...(slide as Record<string, unknown>) };
      let id =
        typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : "";
      if (!id && typeof entry.title === "string") {
        id = slugifyId(entry.title);
      }
      if (!id) id = `slide-${index + 1}`;
      while (usedIds.has(id)) id = `${id}-${index + 1}`;
      usedIds.add(id);
      return { ...entry, id };
    });
  }

  const timeline =
    scrim.timeline && typeof scrim.timeline === "object"
      ? { ...(scrim.timeline as Record<string, unknown>) }
      : null;

  if (timeline) {
    if (
      (scrim.duration_ms === undefined || scrim.duration_ms === null) &&
      typeof timeline.durationMs === "number"
    ) {
      scrim.duration_ms = timeline.durationMs;
    }

    if (Array.isArray(timeline.events)) {
      const slides = Array.isArray(scrim.slides)
        ? (scrim.slides as Array<{ id: string }>)
        : [];
      let slideEventIndex = 0;
      timeline.events = timeline.events.map((event, index) => {
        if (!event || typeof event !== "object") return event;
        const entry = { ...(event as Record<string, unknown>) };
        if (entry.type === "slide" && typeof entry.slideId !== "string") {
          entry.slideId =
            slides[slideEventIndex]?.id ?? slides[0]?.id ?? "slide-1";
          slideEventIndex += 1;
        }
        if (entry.type === "challenge" && typeof entry.id !== "string") {
          entry.id = `challenge-${index + 1}`;
        }
        return entry;
      });
    }

    scrim.timeline = timeline;
  }

  return scrim;
}

function parseGeneratedScrim(raw: unknown): GeneratedScrim {
  const result = generatedScrimSchema.safeParse(normalizeGeneratedScrim(raw));
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "root";
    throw new Error(`CodeCast validation failed at ${path}: ${issue?.message ?? "invalid shape"}`);
  }
  return result.data;
}

function parseCodecastResponse(text: string): GeneratedScrim {
  try {
    return parseGeneratedScrim(parseModelJson(text));
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("AI returned truncated or invalid JSON — try again");
    }
    throw err;
  }
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
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(buildCodecastPrompt(context));
  const candidate = result.response.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error("AI response truncated — try again");
  }
  const text = result.response.text();
  if (!text) throw new Error("AI returned an empty CodeCast response");
  return parseCodecastResponse(text);
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
      max_tokens: 8192,
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

    const choice = response.choices[0];
    if (choice?.finish_reason === "length") {
      throw new Error("AI response truncated — try again");
    }
    const content = choice?.message.content;
    if (!content) throw new Error("AI returned an empty CodeCast response");
    return parseCodecastResponse(content);
  } catch (structuredError) {
    const retry = await client.chat.completions.create({
      model: config.model,
      messages: [
        ...messages,
        {
          role: "user",
          content:
            "Return valid JSON only for the same CodeCast request. Use at most 4 slides and 6 files events. Do not add commentary.",
        },
      ],
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const retryChoice = retry.choices[0];
    if (retryChoice?.finish_reason === "length") {
      throw new Error("AI response truncated — try again");
    }
    const content = retryChoice?.message.content;
    if (!content) {
      throw structuredError instanceof Error
        ? structuredError
        : new Error("Could not generate CodeCast");
    }
    return parseCodecastResponse(content);
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
