/** Extract and parse JSON from an LLM text response (raw JSON or fenced). */
export function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("AI returned empty content");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error("AI returned invalid JSON");
  }
}
