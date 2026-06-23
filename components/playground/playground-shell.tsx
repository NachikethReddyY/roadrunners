"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type {
  PlaygroundConfig,
  ScrimEvent,
  ScrimSlide,
} from "@/lib/schemas/playground";
import { ScrimPlayer } from "@/components/playground/scrim-player";
import { fileRecordsEqual } from "@/lib/playground/vfs";
import { cn } from "@/lib/utils";

const SandpackWorkspace = dynamic(
  () =>
    import("@/components/playground/sandpack-workspace").then(
      (m) => m.SandpackWorkspace
    ),
  { ssr: false, loading: () => <WorkspaceSkeleton /> }
);

const CodeWorkspace = dynamic(
  () =>
    import("@/components/playground/code-workspace").then(
      (m) => m.CodeWorkspace
    ),
  { ssr: false, loading: () => <WorkspaceSkeleton /> }
);

type PlaygroundShellProps = {
  config: PlaygroundConfig;
  title?: string;
  breadcrumb?: string;
  scrim?: {
    durationMs: number;
    events: ScrimEvent[];
    slides: ScrimSlide[];
    initialFiles: Record<string, string>;
  };
  /** Full-bleed IDE chrome (no rounded card). */
  fullscreen?: boolean;
  className?: string;
  onOutput?: (output: string) => void;
  onFilesChange?: (files: Record<string, string>) => void;
};

function WorkspaceSkeleton() {
  return (
    <div className="flex h-full min-h-0 animate-pulse items-center justify-center bg-[var(--canvas-dark)] text-sm text-[var(--on-dark-mute)]">
      Loading workspace…
    </div>
  );
}

const SCRIM_DOCK_PX = 48;
export const WORKSPACE_BOTTOM_CHROME_PX = SCRIM_DOCK_PX + 8;

export function PlaygroundShell({
  config,
  title,
  breadcrumb,
  scrim,
  fullscreen = false,
  className,
  onOutput,
  onFilesChange: onFilesChangeExternal,
}: PlaygroundShellProps) {
  const baseFiles = scrim?.initialFiles ?? config.files;
  const [files, setFiles] = useState(baseFiles);
  const [activeFile, setActiveFile] = useState<string | null>(
    config.activeFile ?? Object.keys(baseFiles)[0] ?? null
  );
  const [readOnly, setReadOnly] = useState(!!scrim);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [lastOutput, setLastOutput] = useState("");
  const [runSignal, setRunSignal] = useState(0);

  const handleScrimState = useCallback(
    (state: {
      files: Record<string, string>;
      activeFile: string | null;
      caption: string | null;
      slideId: string | null;
      readOnly: boolean;
    }) => {
      setFiles((prev) =>
        fileRecordsEqual(prev, state.files) ? prev : state.files
      );
      setActiveFile(state.activeFile);
      setReadOnly(state.readOnly);
      if (state.slideId) setActiveSlideId(state.slideId);
    },
    []
  );

  const handleFilesChange = useCallback(
    (next: Record<string, string>) => {
      setFiles((prev) => (fileRecordsEqual(prev, next) ? prev : next));
      onFilesChangeExternal?.(next);
    },
    [onFilesChangeExternal]
  );

  const useCodeWorkspace = config.template === "python";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-[var(--canvas-dark)]",
        !fullscreen && [
          "min-h-[70vh] rounded-xl border border-[var(--hairline-warm)]/80",
          "shadow-[0_8px_40px_rgba(0,0,0,0.45)]",
        ],
        className
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {useCodeWorkspace ? (
          <CodeWorkspace
            files={files}
            activeFile={activeFile}
            readOnly={readOnly}
            defaultLanguage="python"
            title={title}
            breadcrumb={breadcrumb}
            template={config.template}
            slides={scrim?.slides}
            activeSlideId={activeSlideId}
            onSelectSlide={setActiveSlideId}
            onFilesChange={handleFilesChange}
            onOutput={onOutput ?? setLastOutput}
            runSignal={runSignal}
            scrimDockPx={scrim ? WORKSPACE_BOTTOM_CHROME_PX : 0}
            className="h-full flex-1"
          />
        ) : (
          <SandpackWorkspace
            template={config.template === "react-ts" ? "react-ts" : "vanilla"}
            files={files}
            activeFile={activeFile}
            readOnly={readOnly}
            showPreview={config.preview !== false}
            onFilesChange={readOnly ? undefined : handleFilesChange}
          />
        )}

        {scrim && (
          <div className="absolute inset-x-0 bottom-0 z-40">
            <ScrimPlayer
              durationMs={scrim.durationMs}
              events={scrim.events}
              initialFiles={scrim.initialFiles}
              onStateChange={handleScrimState}
              onRun={() => setRunSignal((n) => n + 1)}
            />
          </div>
        )}
      </div>

      {config.completion === "output_contains" && config.completionTarget && (
        <p className="sr-only" data-output={lastOutput} data-target={config.completionTarget} />
      )}
    </div>
  );
}

export function isCompletionMet(
  config: PlaygroundConfig,
  output: string
): boolean {
  if (config.completion === "manual" || config.completion === "tests") {
    return true;
  }
  if (config.completion === "output_contains" && config.completionTarget) {
    return output.includes(config.completionTarget);
  }
  return true;
}
