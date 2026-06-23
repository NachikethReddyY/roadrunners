"use client";

import dynamic from "next/dynamic";
import { Group, Panel } from "react-resizable-panels";
import { EditorTabs } from "@/components/playground/editor-tabs";
import { ResizeSeparator } from "@/components/playground/resize-separator";
import { languageFromPath, type VfsState } from "@/lib/playground/vfs";
import { cn } from "@/lib/utils";

const MonacoEditorPane = dynamic(
  () =>
    import("@/components/playground/monaco-editor-pane").then(
      (m) => m.MonacoEditorPane
    ),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-[#1a1916]" /> }
);

type EditorAreaProps = {
  vfs: VfsState;
  activeFile: string;
  secondaryFile: string | null;
  splitEnabled: boolean;
  openTabs: string[];
  readOnly?: boolean;
  onSelectFile: (path: string) => void;
  onCloseTab?: (path: string) => void;
  onChangeFile: (path: string, content: string) => void;
  className?: string;
};

function EditorPane({
  path,
  vfs,
  readOnly,
  onChangeFile,
  label,
}: {
  path: string;
  vfs: VfsState;
  readOnly?: boolean;
  onChangeFile: (path: string, content: string) => void;
  label?: string;
}) {
  const file = vfs[path];
  if (!file) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {label && (
        <div className="shrink-0 border-b border-[var(--hairline-warm)]/60 px-3 py-1">
          <span className="font-mono text-[10px] text-[var(--on-dark-mute)]">
            {label}
          </span>
        </div>
      )}
      <MonacoEditorPane
        path={path}
        value={file.content}
        language={file.language || languageFromPath(path)}
        readOnly={readOnly}
        onChange={(content) => onChangeFile(path, content)}
        className="min-h-0 flex-1"
      />
    </div>
  );
}

export function EditorArea({
  vfs,
  activeFile,
  secondaryFile,
  splitEnabled,
  openTabs,
  readOnly,
  onSelectFile,
  onCloseTab,
  onChangeFile,
  className,
}: EditorAreaProps) {
  const showSplit = splitEnabled && secondaryFile && secondaryFile !== activeFile;

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1a1916]", className)}>
      <EditorTabs
        openTabs={openTabs}
        activeFile={activeFile}
        onSelect={onSelectFile}
        onClose={readOnly ? undefined : onCloseTab}
        className="shrink-0 border-b border-[var(--hairline-warm)]"
      />

      <div className="min-h-0 flex-1">
        {showSplit ? (
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize={50} minSize={25}>
              <EditorPane
                path={activeFile}
                vfs={vfs}
                readOnly={readOnly}
                onChangeFile={onChangeFile}
              />
            </Panel>
            <ResizeSeparator orientation="horizontal" />
            <Panel defaultSize={50} minSize={25}>
              <EditorPane
                path={secondaryFile}
                vfs={vfs}
                readOnly={readOnly}
                onChangeFile={onChangeFile}
              />
            </Panel>
          </Group>
        ) : (
          <EditorPane
            path={activeFile}
            vfs={vfs}
            readOnly={readOnly}
            onChangeFile={onChangeFile}
          />
        )}
      </div>
    </div>
  );
}
