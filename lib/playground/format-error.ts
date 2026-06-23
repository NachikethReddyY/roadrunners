/** Turn raw runtime errors into short, actionable hints. */
export function formatRuntimeError(
  raw: string,
  language: "python" | "javascript" | "shell"
): string {
  const msg = raw.trim();

  if (language === "python") {
    if (/unterminated string literal/i.test(msg) || /unescaped line break/i.test(msg)) {
      return [
        "SyntaxError: String not closed properly.",
        "  • Keep your string on one line, or use triple quotes: \"\"\"like this\"\"\"",
        "  • Every opening quote needs a matching closing quote on the same line (unless using triple quotes).",
      ].join("\n");
    }
    if (/invalid syntax/i.test(msg)) {
      const line = msg.match(/line (\d+)/i);
      return `SyntaxError: Python couldn't parse this code${line ? ` (near line ${line[1]})` : ""}. Check brackets, quotes, and colons.`;
    }
    if (/name '(.+)' is not defined/i.test(msg)) {
      const m = msg.match(/name '(.+)' is not defined/i);
      return `NameError: "${m?.[1]}" isn't defined yet. Did you spell it correctly or define it first?`;
    }
    if (/indentationerror/i.test(msg)) {
      return "IndentationError: Indentation is off — use consistent spaces (4 per level in Python).";
    }
  }

  if (language === "javascript") {
    if (/unexpected token/i.test(msg) || /invalid or unexpected token/i.test(msg)) {
      return [
        "SyntaxError: JavaScript couldn't parse this.",
        "  • Check quotes, brackets, and semicolons.",
        "  • Strings can't contain raw line breaks — close the quote or use backticks.",
      ].join("\n");
    }
    if (/is not defined/i.test(msg)) {
      const m = msg.match(/(\w+) is not defined/i);
      return `ReferenceError: "${m?.[1]}" isn't defined. Declare it before use.`;
    }
  }

  // Strip noisy Pyodide / browser prefixes
  const cleaned = msg
    .replace(/^PythonError:\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .replace(/\nTraceback \(most recent call last\):[\s\S]*/i, (block) => {
      const last = block.trim().split("\n").pop();
      return last ? `\n${last}` : "";
    });

  return cleaned || msg;
}
