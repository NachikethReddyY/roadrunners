"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { BookOpenText, CirclePlay, Code2, Library, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { SaveScrimDialog } from "@/components/playground/save-scrim-dialog";
import { ScrimPlayer, notifyScrimChallengeRun } from "@/components/playground/scrim-player";
import { saveCheckpoint } from "@/lib/actions/scrim";
import { ROUTES } from "@/lib/constants/routes";
import type {
  PlaygroundConfig,
  PlaygroundTemplate,
  ScrimChallengeEvent,
  ScrimEvent,
  ScrimNarration,
  ScrimSlide,
} from "@/lib/schemas/playground";
import { applyTimelineAt, captionEventAt, challengeEvents } from "@/lib/schemas/playground";
import { fileRecordsEqual } from "@/lib/playground/vfs";
import { Button, buttonVariants } from "@/components/ui/button";
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

type LessonStage = "read" | "watch" | "try" | "save";

const lessonStageMeta: Array<{
  id: LessonStage;
  label: string;
  description: string;
  icon: typeof BookOpenText;
}> = [
  {
    id: "read",
    label: "Read",
    description: "Understand the concept before the walkthrough starts.",
    icon: BookOpenText,
  },
  {
    id: "watch",
    label: "Watch",
    description: "Follow the guided lesson like a CodeCast video.",
    icon: CirclePlay,
  },
  {
    id: "try",
    label: "Try",
    description: "Pause, edit the code, and run it yourself.",
    icon: Code2,
  },
  {
    id: "save",
    label: "Save",
    description: "Store this lesson as your own reusable scrim.",
    icon: Save,
  },
];

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

function formatLessonDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function captionTimeline(events: ScrimEvent[]) {
  return events
    .filter((event): event is Extract<ScrimEvent, { type: "caption" }> => event.type === "caption")
    .sort((a, b) => a.t - b.t);
}

function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
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
  const immersiveScrim = Boolean(scrim && fullscreen);
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
  const [activeStage, setActiveStage] = useState<LessonStage>(
    scrim ? (immersiveScrim ? "watch" : "read") : "try"
  );
  const [savedScrimId, setSavedScrimId] = useState<string | null>(userScrimId ?? null);
  const [currentCaption, setCurrentCaption] = useState<string | null>(
    scrim ? captionEventAt(scrim.events, scrim.initialTimelineMs ?? 0)?.text ?? null : null
  );
  const [forcePauseSignal, setForcePauseSignal] = useState(0);
  const hasBakedAudio =
    Boolean(scrim?.narration?.audio_url) ||
    (scrim?.events.some((event) => event.type === "caption" && Boolean(event.audio_url)) ?? false);
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

  const moveToStage = useCallback((stage: LessonStage) => {
    setActiveStage(stage);
    if (stage !== "watch") {
      setForcePauseSignal((value) => value + 1);
    }
  }, []);

  const openSaveStage = useCallback(() => {
    moveToStage("save");
    setSaveDialogOpen(true);
  }, [moveToStage]);

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
    setCurrentCaption(initial.caption);
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
      setCurrentCaption(state.caption);
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
  const canSaveScrim = Boolean(scrim && journeyId);
  const scrimLibraryHref = journeyId ? ROUTES.journeyScrims(journeyId) : null;
  const savedScrimHref =
    journeyId && savedScrimId ? ROUTES.journeyMyScrim(journeyId, savedScrimId) : null;
  const activeSlide =
    scrim?.slides.find((slide) => slide.id === activeSlideId) ?? scrim?.slides[0] ?? null;
  const lessonCaptions = scrim ? captionTimeline(scrim.events) : [];
  const lessonChallenges = scrim ? challengeEvents(scrim.events) : [];
  const highlightedCaption =
    currentCaption ?? lessonCaptions[0]?.text ?? "Use the player to step through the lesson.";

  const defaultScrimTitle =
    title ??
    `CodeCast ${new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;

  const stageHeader = scrim && !immersiveScrim ? (
    <div className="border-b border-[var(--hairline-warm)]/70 bg-[color:color-mix(in_oklch,var(--surface),white_3%)] px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Lesson flow
            </p>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {title ?? "Interactive scrim"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Open the lesson in phases instead of starting inside the editor: read first, watch the
              walkthrough, try the code, then save it as a scrim from the same UI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">
              {formatLessonDuration(scrim.durationMs)} lesson
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {scrim.slides.length} reading cards
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {lessonChallenges.length} tryout checkpoints
            </span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {lessonStageMeta.map((stage) => {
            const Icon = stage.icon;
            const isActive = stage.id === activeStage;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => moveToStage(stage.id)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border bg-background/70 hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  const readStage = scrim && !immersiveScrim ? (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Reading portion
          </p>
          <h3 className="mt-2 font-heading text-2xl font-semibold">
            Understand the lesson before the walkthrough begins
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This keeps the journey lesson from feeling like a tiny W3Schools-style editor. The user
            can read the concept first, then decide when to watch and when to code.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => moveToStage("watch")}>
              Start watching
            </Button>
            <Button type="button" variant="outline" onClick={() => moveToStage("try")}>
              Skip to code tryout
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Journey phases
          </p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Watch</p>
              <p>Follow the scrim player as the lesson writes code and advances step by step.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Try</p>
              <p>Pause the lesson, edit files in the workspace, and run the result yourself.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Save</p>
              <p>Save the current lesson into the scrim library without leaving this page.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {scrim.slides.map((slide, index) => (
          <article key={slide.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Step {index + 1}
            </p>
            <h4 className="mt-2 font-heading text-lg font-semibold">{slide.title}</h4>
            {slide.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.image_url}
                alt={slide.title}
                className="mt-4 max-h-52 w-full rounded-xl border border-border object-cover"
              />
            )}
            {slide.markdown ? (
              <div className="mt-4">
                <MarkdownBlock markdown={slide.markdown} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                This section is part of the guided walkthrough.
              </p>
            )}
          </article>
        ))}
      </div>

      {lessonChallenges.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Practice checkpoints
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {lessonChallenges.map((challenge) => (
              <div key={challenge.id} className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">{challenge.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{challenge.instructions}</p>
                {challenge.hint && (
                  <p className="mt-2 text-xs text-muted-foreground">Hint: {challenge.hint}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  ) : null;

  const watchOrTryBanner = scrim && !immersiveScrim ? (
    <div className="border-b border-[var(--hairline-warm)]/70 bg-[color:color-mix(in_oklch,var(--surface),white_2%)] px-4 py-4 sm:px-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {activeStage === "watch" ? "Video walkthrough" : "Code tryout"}
          </p>
          <h3 className="mt-2 font-heading text-xl font-semibold">
            {activeStage === "watch"
              ? "Use the player below to watch the lesson in sequence"
              : "The editor is paused so the learner can edit and run the code"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeStage === "watch"
              ? "The workspace stays in sync with the scrim timeline so the lesson behaves like a guided video, not just a static editor."
              : "This stage is meant for hands-on execution. Use the Run control in the workspace toolbar and the player will keep your progress checkpointed."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeStage === "watch" ? (
              <Button type="button" onClick={() => moveToStage("try")}>
                Switch to tryout
              </Button>
            ) : (
              <Button type="button" onClick={openSaveStage}>
                Save as scrim
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => moveToStage("read")}>
              Back to reading
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Current focus
          </p>
          <h4 className="mt-2 text-base font-semibold text-foreground">
            {activeSlide?.title ?? "Guided walkthrough"}
          </h4>
          {activeSlide?.markdown ? (
            <div className="mt-3 text-sm">
              <MarkdownBlock markdown={activeSlide.markdown} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{highlightedCaption}</p>
          )}
          <div className="mt-4 rounded-xl border border-border bg-background/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Live caption
            </p>
            <p className="mt-2 text-sm text-foreground">{highlightedCaption}</p>
          </div>
        </aside>
      </div>
    </div>
  ) : null;

  const saveStage = scrim && !immersiveScrim ? (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Save scrim
          </p>
          <h3 className="mt-2 font-heading text-2xl font-semibold">
            Keep this lesson as a reusable personal scrim
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Save the current lesson state, timeline, and workspace files without leaving the lesson
            UI. That makes the scrim easy to reopen later from the journey library.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canSaveScrim && (
              <Button type="button" onClick={() => setSaveDialogOpen(true)}>
                Save current scrim
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => moveToStage("try")}>
              Back to tryout
            </Button>
          </div>

          {savedScrimHref && (
            <div className="mt-4 rounded-xl border border-[var(--semantic-success)]/30 bg-[var(--semantic-success)]/10 p-4">
              <p className="text-sm font-semibold text-foreground">Scrim saved</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your personal copy is available from the lesson library and can be reopened directly.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={savedScrimHref} className={buttonVariants({ variant: "outline" })}>
                  Open saved scrim
                </Link>
                {scrimLibraryHref && (
                  <Link href={scrimLibraryHref} className={buttonVariants({ variant: "ghost" })}>
                    Open scrim library
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            What gets saved
          </p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Timeline position</p>
              <p>
                Resume point: {formatLessonDuration(resumeTimelineMs)} of{" "}
                {formatLessonDuration(scrim.durationMs)}
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Lesson assets</p>
              <p>{scrim.slides.length} reading cards and the guided walkthrough timeline.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Current files</p>
              <p>{Object.keys(files).length} workspace file(s) will be included in the save.</p>
            </div>
          </div>

          {scrimLibraryHref && (
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Library className="size-4 text-primary" />
                Scrim library
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Saved scrims continue to live in the journey CodeCast library for reuse.
              </p>
            </div>
          )}
        </aside>
      </div>

      {lessonCaptions.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Lesson moments
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {lessonCaptions.map((caption) => (
              <div key={`${caption.t}-${caption.text}`} className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {formatLessonDuration(caption.t)}
                </p>
                <p className="mt-2 text-sm text-foreground">{caption.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  ) : null;

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
      {stageHeader}

      {scrim && !immersiveScrim && activeStage === "read" ? (
        readStage
      ) : scrim && !immersiveScrim && activeStage === "save" ? (
        saveStage
      ) : (
        <>
          {scrim && watchOrTryBanner}
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
                setRunSignal((value) => value + 1);
              }}
              onSaveCheckpoint={journeyId ? persistCheckpoint : undefined}
              onSaveAsScrim={canSaveScrim ? openSaveStage : undefined}
              saveStatus={saveStatus}
              forcePauseSignal={forcePauseSignal}
            />
          )}
        </>
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
          onSaved={(scrimId) => {
            setSavedScrimId(scrimId);
            moveToStage("save");
          }}
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
