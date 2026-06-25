"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { SaveScrimDialog } from "@/components/playground/save-scrim-dialog";
import type {
  PlaygroundConfig,
  PlaygroundTemplate,
  ScrimChallengeEvent,
  ScrimEvent,
  ScrimNarration,
  ScrimSlide,
} from "@/lib/schemas/playground";
import { applyTimelineAt } from "@/lib/schemas/playground";
import { ScrimPlayer, notifyScrimChallengeRun } from "@/components/playground/scrim-player";
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
    narration?: ScrimNarration;
    initialFiles: Record<string, string>;
    initialTimelineMs?: number;
    scrimSlug?: string;
    demoMode?: boolean;
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
  const [activeChallenge, setActiveChallenge] = useState<ScrimChallengeEvent | null>(null);
  const [lastOutput, setLastOutput] = useState("");
  const [runSignal, setRunSignal] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listenControlMounted, setListenControlMounted] = useState(false);
  const hasBakedAudio =
    Boolean(scrim?.narration?.audio_url) ||
    (scrim?.events.some(
      (e) => e.type === "caption" && Boolean(e.audio_url)
    ) ?? false);
  const narrationAvailable = ttsAvailable || hasBakedAudio;

  const [listenEnabled, setListenEnabled] = useState(hasBakedAudio);
  const [resumeTimelineMs, setResumeTimelineMs] = useState(scrim?.initialTimelineMs ?? 0);
  const scrimStateRef = useRef({ currentMs: scrim?.initialTimelineMs ?? 0, playing: false });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = window.setTimeout(() => {
      setListenControlMounted(true);
      const stored = localStorage.getItem(LISTEN_KEY);
      if (stored !== null) setListenEnabled(stored === "true");
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleListenToggle = useCallback((enabled: boolean) => {
    setListenEnabled(enabled);
    localStorage.setItem(LISTEN_KEY, String(enabled));
  }, []);

  const scrimBootstrappedRef = useRef(false);

  useEffect(() => {
    if (!scrim || scrimBootstrappedRef.current) return;
    scrimBootstrappedRef.current = true;
    const initial = applyTimelineAt(
      scrim.initialFiles,
      scrim.events,
      scrim.initialTimelineMs ?? 0
    );
    setFiles(initial.files);
    setActiveFile(initial.activeFile);
    if (initial.slideId) {
      requestAnimationFrame(() => setActiveSlideId(initial.slideId));
    }
  }, [scrim]);

  const handleScrimState = useCallback(
    (state: {
      files: Record<string, string>;
      activeFile: string | null;
      caption: string | null;
      slideId: string | null;
      readOnly: boolean;
      currentMs: number;
      playing: boolean;
      challenge: ScrimChallengeEvent | null;
    }) => {
      scrimStateRef.current = { currentMs: state.currentMs, playing: state.playing };
      setResumeTimelineMs(state.currentMs);
      setActiveChallenge(state.challenge);
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
    title ??
    `CodeCast ${new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;

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
            challengeActive={Boolean(activeChallenge)}
            onUserRun={(result) =>
              notifyScrimChallengeRun({
                files,
                stdout: result.stdout,
                stderr: result.stderr,
                error: result.error,
              })
            }
            runSignal={runSignal}
            journeyId={journeyId}
            nodeId={nodeId}
            lessonScrimId={lessonScrimId}
            userScrimId={userScrimId}
            demoMode={scrim?.demoMode}
            scrimSlug={scrim?.scrimSlug}
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
      </div>

      {scrim && (
        <ScrimPlayer
          durationMs={scrim.durationMs}
          events={scrim.events}
          initialFiles={scrim.initialFiles}
          narration={scrim.narration}
          initialMs={scrim.initialTimelineMs ?? 0}
          listenEnabled={listenEnabled}
          onListenToggle={
            narrationAvailable && listenControlMounted
              ? handleListenToggle
              : undefined
          }
          onStateChange={handleScrimState}
          onRun={() => {
            setRunSignal((n) => n + 1);
          }}
          onSaveCheckpoint={journeyId ? persistCheckpoint : undefined}
          onSaveAsScrim={
            journeyId ? () => setSaveDialogOpen(true) : undefined
          }
          saveStatus={saveStatus}
        />
      )}

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
          resumeTimelineMs={resumeTimelineMs}
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
