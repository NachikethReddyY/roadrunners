"use client";

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
  type SandpackFiles,
} from "@codesandbox/sandpack-react";
import { useEffect } from "react";

type SandpackWorkspaceProps = {
  template: "vanilla" | "react-ts";
  files: Record<string, string>;
  activeFile?: string | null;
  readOnly?: boolean;
  showPreview?: boolean;
  onFilesChange?: (files: Record<string, string>) => void;
};

function toSandpackFiles(files: Record<string, string>): SandpackFiles {
  const entries = Object.entries(files);
  if (entries.length === 0) {
    return { "/index.js": { code: "// add code here", active: true } };
  }
  return Object.fromEntries(
    entries.map(([path, code]) => [
      path.startsWith("/") ? path : `/${path}`,
      { code },
    ])
  );
}

const sandpackTheme = {
  colors: {
    surface1: "#1c1b19",
    surface2: "#26251e",
    surface3: "#2a2926",
    clickable: "#807d72",
    base: "#ececec",
    disabled: "#525252",
    hover: "#f5f5f7",
    accent: "#d97706",
    error: "#cf2d56",
    errorSurface: "#2a2926",
  },
  syntax: {
    plain: "#ececec",
    comment: { color: "#807d72", fontStyle: "italic" as const },
    keyword: { color: "#9fbbe0" },
    tag: { color: "#9fc9a2" },
    punctuation: { color: "#a3a3a3" },
    definition: { color: "#dfa88f" },
    property: { color: "#c0a8dd" },
    static: { color: "#c08532" },
    string: { color: "#9fc9a2" },
  },
  font: {
    body: 'ui-monospace, "JetBrains Mono", monospace',
    mono: 'ui-monospace, "JetBrains Mono", monospace',
    size: "14px",
    lineHeight: "1.5",
  },
};

export function SandpackWorkspace({
  template,
  files,
  activeFile,
  readOnly = false,
  showPreview = true,
  onFilesChange,
}: SandpackWorkspaceProps) {
  const sandpackFiles = toSandpackFiles(files);
  const activePath = activeFile
    ? activeFile.startsWith("/")
      ? activeFile
      : `/${activeFile}`
    : undefined;

  if (activePath && sandpackFiles[activePath]) {
    (sandpackFiles[activePath] as { active?: boolean }).active = true;
  }

  const providerKey = `${template}-${readOnly}-${Object.keys(files).join(",")}`;

  return (
    <SandpackProvider
      key={providerKey}
      template={template === "react-ts" ? "react-ts" : "vanilla"}
      files={sandpackFiles}
      theme={sandpackTheme}
      options={{
        activeFile: activePath,
        visibleFiles: Object.keys(sandpackFiles),
        recompileMode: "delayed",
        recompileDelay: 400,
      }}
    >
      {onFilesChange && !readOnly && (
        <SandpackFilesSync onFilesChange={onFilesChange} />
      )}
      <div className="flex h-full min-h-[360px] flex-col">
        <SandpackLayout
          style={{
            border: "none",
            borderRadius: 0,
            flex: 1,
            minHeight: 280,
          }}
        >
          <SandpackFileExplorer style={{ height: "100%", minWidth: 140 }} />
          <SandpackCodeEditor
            showTabs
            showLineNumbers
            showInlineErrors
            style={{ height: "100%", flex: 1 }}
          />
          {showPreview && (
            <SandpackPreview
              style={{ height: "100%", minHeight: 200 }}
              showOpenInCodeSandbox={false}
            />
          )}
        </SandpackLayout>
        <SandpackConsole style={{ height: 120, maxHeight: 120 }} />
      </div>
    </SandpackProvider>
  );
}

function SandpackFilesSync({
  onFilesChange,
}: {
  onFilesChange: (files: Record<string, string>) => void;
}) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    const normalized = Object.fromEntries(
      Object.entries(sandpack.files).map(([path, file]) => [
        path.replace(/^\//, ""),
        file.code,
      ])
    );
    onFilesChange(normalized);
  }, [sandpack.files, onFilesChange]);

  return null;
}
