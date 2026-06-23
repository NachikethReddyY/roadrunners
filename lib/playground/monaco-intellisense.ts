import type { Monaco } from "@monaco-editor/react";

let configured = false;

type ProvideCompletionItems = NonNullable<
  Parameters<Monaco["languages"]["registerCompletionItemProvider"]>[1]["provideCompletionItems"]
>;
type CompletionModel = Parameters<ProvideCompletionItems>[0];
type CompletionPosition = Parameters<ProvideCompletionItems>[1];

const PYTHON_KEYWORDS = [
  "False",
  "True",
  "None",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
];

const PYTHON_BUILTINS = [
  "print",
  "len",
  "range",
  "str",
  "int",
  "float",
  "bool",
  "list",
  "dict",
  "set",
  "tuple",
  "type",
  "input",
  "open",
  "enumerate",
  "zip",
  "map",
  "filter",
  "sorted",
  "sum",
  "min",
  "max",
  "abs",
  "round",
  "isinstance",
  "hasattr",
  "getattr",
  "setattr",
  "super",
  "property",
  "staticmethod",
  "classmethod",
];

const PYTHON_SNIPPETS: Array<{
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
}> = [
  {
    label: "def",
    insertText: "def ${1:name}(${2:args}):\n\t${3:pass}",
    detail: "function",
    documentation: "Define a function",
  },
  {
    label: "class",
    insertText: "class ${1:Name}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}",
    detail: "class",
    documentation: "Define a class",
  },
  {
    label: "if",
    insertText: "if ${1:condition}:\n\t${2:pass}",
    detail: "if statement",
    documentation: "Conditional branch",
  },
  {
    label: "elif",
    insertText: "elif ${1:condition}:\n\t${2:pass}",
    detail: "elif branch",
    documentation: "Else-if branch",
  },
  {
    label: "for",
    insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}",
    detail: "for loop",
    documentation: "Iterate over a sequence",
  },
  {
    label: "while",
    insertText: "while ${1:condition}:\n\t${2:pass}",
    detail: "while loop",
    documentation: "Loop while condition is true",
  },
  {
    label: "print",
    insertText: "print(${1:value})",
    detail: "print()",
    documentation: "Write to stdout",
  },
  {
    label: "main",
    insertText:
      'if __name__ == "__main__":\n\t${1:main()}',
    detail: "main guard",
    documentation: "Run code only when executed directly",
  },
  {
    label: "try",
    insertText:
      "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}",
    detail: "try/except",
    documentation: "Handle exceptions",
  },
  {
    label: "with",
    insertText: "with ${1:resource} as ${2:var}:\n\t${3:pass}",
    detail: "with statement",
    documentation: "Context manager",
  },
  {
    label: "import",
    insertText: "import ${1:module}",
    detail: "import",
    documentation: "Import a module",
  },
  {
    label: "from",
    insertText: "from ${1:module} import ${2:name}",
    detail: "from import",
    documentation: "Import names from a module",
  },
];

/** ponytail: curated subset of Tailwind v4 utilities — upgrade path = tailwindcss-language-service */
const TAILWIND_CLASSES = [
  "flex",
  "inline-flex",
  "grid",
  "block",
  "inline-block",
  "hidden",
  "flex-col",
  "flex-row",
  "flex-wrap",
  "items-center",
  "items-start",
  "items-end",
  "justify-center",
  "justify-between",
  "justify-start",
  "gap-1",
  "gap-2",
  "gap-4",
  "gap-8",
  "p-0",
  "p-1",
  "p-2",
  "p-3",
  "p-4",
  "p-6",
  "p-8",
  "px-2",
  "px-4",
  "py-2",
  "py-4",
  "m-0",
  "m-2",
  "m-4",
  "mx-auto",
  "my-4",
  "mt-2",
  "mb-4",
  "w-full",
  "w-1/2",
  "h-full",
  "h-screen",
  "min-h-screen",
  "max-w-sm",
  "max-w-md",
  "max-w-lg",
  "max-w-xl",
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
  "text-left",
  "text-center",
  "text-right",
  "text-white",
  "text-black",
  "text-gray-500",
  "text-gray-900",
  "bg-white",
  "bg-black",
  "bg-gray-100",
  "bg-gray-900",
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-amber-500",
  "rounded",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-full",
  "border",
  "border-2",
  "border-gray-200",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "opacity-50",
  "opacity-100",
  "transition",
  "duration-150",
  "hover:bg-gray-100",
  "hover:opacity-80",
  "focus:outline-none",
  "focus:ring-2",
  "sm:flex",
  "md:grid",
  "lg:flex-row",
];

const REACT_STUB = `
declare module "react" {
  export type ReactNode = unknown;
  export type FC<P = object> = (props: P) => ReactNode;
  export function useState<S>(initial: S): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useRef<T>(initial: T): { current: T };
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(fn: T, deps: readonly unknown[]): T;
  const React: {
    createElement: unknown;
    Fragment: unknown;
  };
  export default React;
}
declare module "react/jsx-runtime" {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}
`;

function registerPythonCompletions(monaco: Monaco) {
  monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [".", " "],
    provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const keywords = PYTHON_KEYWORDS.map((kw) => ({
        label: kw,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: kw,
        range,
      }));

      const builtins = PYTHON_BUILTINS.map((name) => ({
        label: name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: name,
        detail: "builtin",
        range,
      }));

      const snippets = PYTHON_SNIPPETS.map((s) => ({
        label: s.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: s.insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: s.detail,
        documentation: s.documentation,
        range,
      }));

      return { suggestions: [...snippets, ...builtins, ...keywords] };
    },
  });
}

function registerTailwindCompletions(monaco: Monaco) {
  const languages = ["html", "css", "javascript", "typescript"];
  const kind = monaco.languages.CompletionItemKind.Value;

  for (const lang of languages) {
    monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ['"', "'", " ", "-", ":"],
      provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
        const line = model.getLineContent(position.lineNumber);
        const before = line.slice(0, position.column - 1);
        const inClass =
          /\bclass(?:Name)?\s*=\s*["'{][^"'}]*$/.test(before) ||
          /@apply\s+[^;]*$/.test(before) ||
          (lang === "css" && /^\s*[\w-]*$/.test(before.split(/\s/).pop() ?? ""));

        if (!inClass && lang !== "css") return { suggestions: [] };

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const prefix = word.word.toLowerCase();
        const suggestions = TAILWIND_CLASSES.filter(
          (c) => !prefix || c.startsWith(prefix) || c.includes(prefix)
        ).map((c) => ({
          label: c,
          kind,
          insertText: c,
          detail: "Tailwind",
          range,
        }));

        return { suggestions };
      },
    });
  }
}

function setupTypeScriptReact(monaco: Monaco) {
  const compilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    allowJs: true,
    checkJs: false,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    jsxImportSource: "react",
    esModuleInterop: true,
  };

  const diagnostics = {
    noSemanticValidation: false,
    noSyntaxValidation: false,
  };

  for (const defaults of [
    monaco.languages.typescript.javascriptDefaults,
    monaco.languages.typescript.typescriptDefaults,
  ]) {
    defaults.setCompilerOptions(compilerOptions);
    defaults.setDiagnosticsOptions(diagnostics);
    defaults.setEagerModelSync(true);
    defaults.addExtraLib(REACT_STUB, "file:///roadrunner/react-stubs.d.ts");
  }
}

function registerHtmlCssExtras(monaco: Monaco) {
  monaco.languages.html.htmlDefaults.setOptions({
    suggest: { html5: true },
  });

  monaco.languages.css.cssDefaults.setOptions({
    validate: true,
  });
}

/** One-time Monaco IntelliSense for supported playground languages. */
export function setupMonacoIntelliSense(monaco: Monaco): void {
  if (configured) return;
  configured = true;

  setupTypeScriptReact(monaco);
  registerPythonCompletions(monaco);
  registerTailwindCompletions(monaco);
  registerHtmlCssExtras(monaco);
}

export const monacoEditorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  padding: { top: 12 },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
  suggestOnTriggerCharacters: true,
  wordBasedSuggestions: "matchingDocuments" as const,
  parameterHints: { enabled: true },
  suggest: {
    preview: true,
    showKeywords: true,
    showSnippets: true,
    showFunctions: true,
    showClasses: true,
  },
  autoClosingBrackets: "always" as const,
  autoClosingQuotes: "always" as const,
  autoIndent: "full" as const,
  formatOnPaste: true,
  bracketPairColorization: { enabled: true },
};
