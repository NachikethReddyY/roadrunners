"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { SaveScrimDialog } from "@/components/playground/save-scrim-dialog";
import type {
  PlaygroundConfig,
  PlaygroundTemplate,
  ScrimEvent,
  ScrimSlide,
} from "@/lib/schemas/playground";
import { ScrimPlayer } from "@/components/playground/scrim-player";
import { saveCheckpoint } from "@/lib/actions/scrim";
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

const LISTEN_KEY = "roadrunner-scrim-listen";

type PlaygroundShellProps = {
  config: PlaygroundConfig;
  title?: string;
  breadcrumb?: string;
  scrim?: {
    durationMs: number;
    events: ScrimEvent[];
    slides: ScrimSlide[];
    initialFiles: Record<string, string>;
    initialTimelineMs?: number;
  };
  journeyId?: string;
  nodeId?: string;
  lessonScrimId?: string;
  userScrimId?: string;
  skillTag?: string;
  ttsAvailable?: boolean;
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
  journeyId,
  nodeId,
  lessonScrimId,
  userScrimId,
  skillTag,
  ttsAvailable = false,
  fullscreen = false,
  className,
  onOutput,
  onFilesChange: onFilesChangeExternal,
}: PlaygroundShellProps) {
  const resumeFiles = config.files;
  const [files, setFiles] = useState(resumeFiles);
  const [activeFile, setActiveFile] = useState<string | null>(
    config.activeFile ?? Object.keys(resumeFiles)[0] ?? null
  );
  const [readOnly, setReadOnly] = useState(!!scrim);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [lastOutput, setLastOutput] = useState("");
  const [runSignal, setRunSignal] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listenEnabled, setListenEnabled] = useState(false);
  const scrimStateRef = useRef({ currentMs: scrim?.initialTimelineMs ?? 0, playing: false });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LISTEN_KEY);
    setListenEnabled(stored === "true");
  }, []);

  const handleListenToggle = useCallback((enabled: boolean) => {
    setListenEnabled(enabled);
    localStorage.setItem(LISTEN_KEY, String(enabled));
  }, []);

  const handleScrimState = useCallback(
    (state: {
      files: Record<string, string>;
      activeFile: string | null;
      caption: string | null;
      slideId: string | null;
      readOnly: boolean;
      currentMs: number;
      playing: boolean;
    }) => {
      scrimStateRef.current = { currentMs: state.currentMs, playing: state.playing };
      setFiles((prev) => {
        if (!state.playing) return prev;
        return fileRecordsEqual(prev, state.files) ? prev : state.files;
      });
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

  const persistCheckpoint = useCallback(() => {
    if (!journeyId || (!nodeId && !lessonScrimId && !userScrimId)) return;
    setSaveStatus("saving");
    startTransition(async () => {
      const result = await saveCheckpoint({
        journeyId,
        nodeId,
        lessonScrimId,
        userScrimId,
        timelineMs: scrimStateRef.current.currentMs,
        files,
        activeFile: activeFile ?? undefined,
      });
      setSaveStatus(result.ok ? "saved" : "idle");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
    });
  }, [activeFile, files, journeyId, lessonScrimId, nodeId, userScrimId]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const useCodeWorkspace = config.template === "python";

  const defaultScrimTitle =
    title ?? `Scrim ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

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
            journeyId={journeyId}
            nodeId={nodeId}
            lessonScrimId={lessonScrimId}
            userScrimId={userScrimId}
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
              initialMs={scrim.initialTimelineMs ?? 0}
              listenEnabled={listenEnabled}
              onListenToggle={ttsAvailable ? handleListenToggle : undefined}
              onStateChange={handleScrimState}
              onRun={() => setRunSignal((n) => n + 1)}
              onSaveCheckpoint={journeyId ? persistCheckpoint : undefined}
              onSaveAsScrim={
                journeyId ? () => setSaveDialogOpen(true) : undefined
              }
              saveStatus={saveStatus}
            />
          </div>
        )}
      </div>

      {config.completion === "output_contains" && config.completionTarget && (
        <p className="sr-only" data-output={lastOutput} data-target={config.completionTarget} />
      )}

      {scrim && journeyId && (
        <SaveScrimDialog
          open={saveDialogOpen}
          defaultTitle={defaultScrimTitle}
          journeyId={journeyId}
          sourceNodeId={nodeId}
          sourceLessonScrimId={lessonScrimId}
          skillTag={skillTag}
          template={config.template as PlaygroundTemplate}
          initialFiles={files}
          timeline={{
            durationMs: scrim.durationMs,
            events: scrim.events,
          }}
          slides={scrim.slides}
          durationMs={scrim.durationMs}
          resumeTimelineMs={scrimStateRef.current.currentMs}
          onClose={() => setSaveDialogOpen(false)}
        />
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
