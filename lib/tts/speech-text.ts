/**
 * Turn on-screen caption text into speech-friendly narration
 * (code symbols, variables, and punctuation read naturally).
 */
export function captionToSpeechText(text: string): string {
  let s = text.trim();

  const replacements: Array<[RegExp, string]> = [
    [/hello-world/gi, "hello world"],
    [/print\s*\(\s*/g, "print, open parenthesis, "],
    [/print\s*\(/g, "print, open parenthesis, "],
    [/\bf['"]/g, "an f-string starting with "],
    [/\{(\w+)\}/g, "the variable $1"],
    [/\bmain\.py\b/g, "main dot pie"],
    [/\bApp\.tsx\b/g, "App dot T S X"],
    [/\bnode\b/gi, "node"],
    [/--+/g, ", "],
    [/—/g, ", "],
    [/\s*-\s*/g, ", "],
    [/['"]/g, ""],
    [/\(\s*/g, "open parenthesis "],
    [/\)\s*/g, " close parenthesis"],
    [/\s{2,}/g, " "],
  ];

  for (const [pattern, replacement] of replacements) {
    s = s.replace(pattern, replacement);
  }

  return s.trim();
}
