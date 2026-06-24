"use client";

import Editor from "@monaco-editor/react";
import {
  monacoEditorOptions,
  setupMonacoIntelliSense,
} from "@/lib/playground/monaco-intellisense";
import {
  monacoLanguageFromPath,
  monacoPathForLanguage,
} from "@/lib/playground/monaco-language";
import { cn } from "@/lib/utils";

type MonacoEditorPaneProps = {
  path: string;
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

const editorTheme = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#1c1b19",
    "editor.lineHighlightBackground": "#26251e",
    "editorGutter.background": "#1c1b19",
  },
};

export function MonacoEditorPane({
  path,
  value,
  language,
  readOnly = false,
  onChange,
  className,
}: MonacoEditorPaneProps) {
  const monacoLang = language ?? monacoLanguageFromPath(path);
  const monacoPath = monacoPathForLanguage(path);

  return (
    <div className={cn("min-h-0 flex-1", className)}>
      <Editor
        key={monacoPath}
        height="100%"
        path={monacoPath}
        language={monacoLang}
        value={value}
        theme="roadrunner-dark"
        onChange={(v) => onChange(v ?? "")}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("roadrunner-dark", editorTheme);
          setupMonacoIntelliSense(monaco);
        }}
        options={{
          ...monacoEditorOptions,
          readOnly,
        }}
      />
    </div>
  );
}
