"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
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

const darkEditorTheme = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#1c1b19",
    "editor.lineHighlightBackground": "#26251e",
    "editorGutter.background": "#1c1b19",
  },
};

const lightEditorTheme = {
  base: "vs" as const,
  inherit: true,
  rules: [
    { token: "comment", foreground: "525252" },
    { token: "keyword", foreground: "0066CC" },
    { token: "string", foreground: "B45309" },
    { token: "number", foreground: "0066CC" },
  ],
  colors: {
    "editor.background": "#FFFFFF",
    "editor.foreground": "#1D1D1F",
    "editor.lineHighlightBackground": "#F5F5F7",
    "editorGutter.background": "#F5F5F7",
    "editorLineNumber.foreground": "#A3A3A3",
    "editorLineNumber.activeForeground": "#525252",
    "editor.selectionBackground": "#DBEAFE",
    "editor.inactiveSelectionBackground": "#E5E7EB",
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
  const [themeName, setThemeName] = useState("roadrunner-light");

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setThemeName(root.classList.contains("dark") ? "roadrunner-dark" : "roadrunner-light");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("min-h-0 flex-1", className)}>
      <Editor
        height="100%"
        path={monacoPath}
        language={monacoLang}
        value={value}
        theme={themeName}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("roadrunner-dark", darkEditorTheme);
          monaco.editor.defineTheme("roadrunner-light", lightEditorTheme);
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
