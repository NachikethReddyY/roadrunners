"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type {
  PlaygroundConfig,
  ScrimEvent,
  ScrimSlide,
} from "@/lib/schemas/playground";
import { ScrimPlayer } from "@/components/playground/scrim-player";
import { SlidePane } from "@/components/playground/slide-pane";
import { cn } from "@/lib/utils";

const SandpackWorkspace = dynamic(
  () =>
    import("@/components/playground/sandpack-workspace").then(
      (m) => m.SandpackWorkspace
    ),
  { ssr: false, loading: () => <WorkspaceSkeleton /> }
);

const PythonWorkspace = dynamic(
  () =>
    import("@/components/playground/python-workspace").then(
      (m) => m.PythonWorkspace
    ),
  { ssr: false, loading: () => <WorkspaceSkeleton /> }
);

type PlaygroundShellProps = {
  config: PlaygroundConfig;
  title?: string;
  breadcrumb?: string;
  /** Scrim mode: timeline drives editor state */
  scrim?: {
    durationMs: number;
    events: ScrimEvent[];
    slides: ScrimSlide[];
    initialFiles: Record<string, string>;
  };
  className?: string;
  onOutput?: (output: string) => void;
  onFilesChange?: (files: Record<string, string>) => void;
};

function WorkspaceSkeleton() {
  return (
    <div className="flex h-full min-h-[360px] animate-pulse items-center justify-center bg-[var(--surface-dark)] text-sm text-[var(--on-dark-mute)]">
      Loading workspace…
    </div>
  );
}

export function PlaygroundShell({
  config,
  title,
  breadcrumb,
  scrim,
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

  const handleScrimState = useCallback(
    (state: {
      files: Record<string, string>;
      activeFile: string | null;
      caption: string | null;
      slideId: string | null;
      readOnly: boolean;
    }) => {
      setFiles(state.files);
      setActiveFile(state.activeFile);
      setReadOnly(state.readOnly);
      if (state.slideId) setActiveSlideId(state.slideId);
    },
    []
  );

  const handleFilesChange = useCallback(
    (next: Record<string, string>) => {
      setFiles(next);
      onFilesChangeExternal?.(next);
    },
    [onFilesChangeExternal]
  );

  const showPreview = config.preview !== false;
  const isPython = config.template === "python";

  return (
    <div
      className={cn(
        "flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-[var(--hairline-warm)] bg-[var(--canvas-dark)]",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-[var(--hairline-warm)] px-4 py-2">
        <div className="min-w-0">
          {breadcrumb && (
            <p className="truncate text-xs text-[var(--on-dark-mute)]">
              {breadcrumb}
            </p>
          )}
          {title && (
            <h2 className="truncate font-heading text-sm font-semibold text-[var(--on-dark)]">
              {title}
            </h2>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[var(--surface-dark-soft)] px-2 py-0.5 font-mono text-xs uppercase text-[var(--on-dark-mute)]">
          {config.template}
        </span>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {scrim && scrim.slides.length > 0 && (
          <aside className="hidden w-44 shrink-0 border-r border-[var(--hairline-warm)] p-2 lg:block">
            <SlidePane
              slides={scrim.slides}
              activeSlideId={activeSlideId}
              onSelectSlide={setActiveSlideId}
            />
          </aside>
        )}
        <div className="flex-1 overflow-hidden">
          {isPython ? (
            <PythonWorkspace
              files={files}
              activeFile={activeFile}
              readOnly={readOnly}
              onFilesChange={handleFilesChange}
              onOutput={onOutput ?? setLastOutput}
            />
          ) : (
            <SandpackWorkspace
              template={config.template === "react-ts" ? "react-ts" : "vanilla"}
              files={files}
              activeFile={activeFile}
              readOnly={readOnly}
              showPreview={showPreview}
              onFilesChange={readOnly ? undefined : handleFilesChange}
            />
          )}
        </div>
      </div>

      {scrim && (
        <ScrimPlayer
          durationMs={scrim.durationMs}
          events={scrim.events}
          initialFiles={scrim.initialFiles}
          onStateChange={handleScrimState}
        />
      )}

      {/* ponytail: completion check is client-only output_contains; upgrade path = server tests */}
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
