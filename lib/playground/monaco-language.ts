/** Map file paths to Monaco language ids (JSX/TSX → typescript defaults with React). */
export function monacoLanguageFromPath(path: string): string {
  if (path.endsWith("/")) return "plaintext";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "py":
      return "python";
    case "js":
    case "mjs":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}

export function monacoPathForLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jsx" && !path.endsWith(".jsx")) return `${path}.jsx`;
  if (ext === "tsx" && !path.endsWith(".tsx")) return `${path}.tsx`;
  return path;
}
