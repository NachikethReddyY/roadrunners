export type AiProvider = "gemini" | "openai";

export type AiConfig = {
  apiKey: string;
  model: string;
  provider: AiProvider;
};

function resolveProvider(
  explicit: string | undefined,
  model: string
): AiProvider {
  if (explicit === "openai" || explicit === "gemini") return explicit;
  if (/^(gpt-|o[0-9])/.test(model)) return "openai";
  return "gemini";
}

function defaultModel(provider: AiProvider): string {
  return provider === "openai" ? "gpt-4.1-mini" : "gemini-2.0-flash";
}

/**
 * Reads Chikky AI env (primary) with legacy GEMINI_* / OPENAI_* fallback.
 *
 * CHIKKY_AI_API_KEY   — provider API key (required)
 * CHIKKY_AI_MODEL     — model id (optional; inferred from provider)
 * CHIKKY_AI_PROVIDER  — gemini | openai (optional; inferred from model name)
 */
export function getAiConfig(): AiConfig | null {
  const chikkyKey = process.env.CHIKKY_AI_API_KEY?.trim();
  if (chikkyKey) {
    const explicitProvider = process.env.CHIKKY_AI_PROVIDER?.trim().toLowerCase();
    const provider = resolveProvider(
      explicitProvider,
      process.env.CHIKKY_AI_MODEL?.trim() ?? ""
    );
    const model =
      process.env.CHIKKY_AI_MODEL?.trim() || defaultModel(provider);
    return {
      apiKey: chikkyKey,
      model,
      provider: resolveProvider(explicitProvider, model),
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return {
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || defaultModel("gemini"),
      provider: "gemini",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || defaultModel("openai"),
      provider: "openai",
    };
  }

  return null;
}

export function isAiConfigured(): boolean {
  return getAiConfig() !== null;
}
