"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, useGroupRef, usePanelRef } from "react-resizable-panels";
import { ConsolePane } from "@/components/playground/console-pane";
import { EditorArea } from "@/components/playground/editor-area";
import { FileSidebar } from "@/components/playground/file-sidebar";
import { ResizeSeparator } from "@/components/playground/resize-separator";
import { WorkspaceToolbar } from "@/components/playground/workspace-toolbar";
import type { ScrimSlide } from "@/lib/schemas/playground";
import {
  ensurePyodide,
  getPythonRuntimeStatus,
  runActiveFile,
  runTerminalLine,
  type RuntimeStatus,
} from "@/lib/playground/execute";
import { runViaDaytona } from "@/lib/playground/daytona-run";
import {
  defaultFilename,
  fileRecordKey,
  listFilePaths,
  vfsFromRecord,
  vfsToRecord,
  type VfsState,
} from "@/lib/playground/vfs";
import { cn } from "@/lib/utils";

type CodeWorkspaceProps = {
  files: Record<string, string>;
  activeFile?: string | null;
  readOnly?: boolean;
  defaultLanguage?: string;
  title?: string;
  breadcrumb?: string;
  template?: string;
  slides?: ScrimSlide[];
  activeSlideId?: string | null;
  onSelectSlide?: (id: string) => void;
  onFilesChange?: (files: Record<string, string>) => void;
  onOutput?: (output: string) => void;
  runSignal?: number;
  scrimDockPx?: number;
  journeyId?: string;
  nodeId?: string;
  lessonScrimId?: string;
  userScrimId?: string;
  className?: string;
};

export function CodeWorkspace({
  files,
  activeFile: activeFileProp,
  readOnly = false,
  defaultLanguage = "python",
  title,
  breadcrumb,
  template = "python",
  slides,
  activeSlideId,
  onSelectSlide,
  onFilesChange,
  onOutput,
  runSignal = 0,
  scrimDockPx = 0,
  journeyId,
  nodeId,
  lessonScrimId,
  userScrimId,
  className,
}: CodeWorkspaceProps) {
  const [vfs, setVfs] = useState<VfsState>(() => vfsFromRecord(files));
  const paths = listFilePaths(vfs);
  const initialActive =
    activeFileProp && vfs[activeFileProp] && !vfs[activeFileProp]?.isFolder
      ? activeFileProp
      : paths[0] ?? defaultFilename();

  const [activeFile, setActiveFile] = useState(initialActive);
  const [openTabs, setOpenTabs] = useState<string[]>([initialActive]);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [secondaryFile, setSecondaryFile] = useState<string | null>(null);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  const [explorerVisible, setExplorerVisible] = useState(true);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shellCwd, setShellCwd] = useState("");
  const [runtimeStatus, setRuntimeStatus] =
    useState<RuntimeStatus>("loading");
  const [running, setRunning] = useState(false);
  const daytonaSessionRef = useRef<string | undefined>(undefined);

  const externalFilesKey = fileRecordKey(files);
  const lastExternalKeyRef = useRef(externalFilesKey);
  const vfsRef = useRef(vfs);
  vfsRef.current = vfs;

  useEffect(() => {
    if (lastExternalKeyRef.current === externalFilesKey) return;
    lastExternalKeyRef.current = externalFilesKey;
    setVfs(vfsFromRecord(files));
  }, [externalFilesKey, files]);

  const lastActivePropRef = useRef(activeFileProp);
  useEffect(() => {
    if (!activeFileProp || activeFileProp === lastActivePropRef.current) return;
    lastActivePropRef.current = activeFileProp;
    if (vfsRef.current[activeFileProp]) {
      setActiveFile(activeFileProp);
      setOpenTabs((tabs) =>
        tabs.includes(activeFileProp) ? tabs : [...tabs, activeFileProp]
      );
    }
  }, [activeFileProp]);

  useEffect(() => {
    let cancelled = false;
    ensurePyodide()
      .then(() => {
        if (!cancelled) setRuntimeStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setRuntimeStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateVfs = useCallback(
    (next: VfsState) => {
      const record = vfsToRecord(next);
      lastExternalKeyRef.current = fileRecordKey(record);
      setVfs(next);
      onFilesChange?.(record);
    },
    [onFilesChange]
  );

  const updateFileContent = useCallback(
    (path: string, content: string) => {
      if (readOnly) return;
      const current = vfsRef.current;
      const next = {
        ...current,
        [path]: { ...current[path], content },
      };
      updateVfs(next);
    },
    [readOnly, updateVfs]
  );

  const selectFile = useCallback((path: string) => {
    setActiveFile(path);
    setOpenTabs((tabs) => (tabs.includes(path) ? tabs : [...tabs, path]));
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((tabs) => {
        const next = tabs.filter((t) => t !== path);
        if (path === activeFile && next[0]) setActiveFile(next[0]);
        if (path === secondaryFile) setSecondaryFile(null);
        return next.length > 0 ? next : tabs;
      });
    },
    [activeFile, secondaryFile]
  );

  const toggleSplit = useCallback(() => {
    setSplitEnabled((on) => {
      if (!on) {
        const other = openTabs.find((t) => t !== activeFile) ?? null;
        setSecondaryFile(other);
      }
      return !on;
    });
  }, [activeFile, openTabs]);

  const groupRef = useGroupRef();
  const terminalPanelRef = usePanelRef();
  const savedLayoutRef = useRef({ editor: 50, terminal: 50 });

  const appendResult = useCallback(
    (result: {
      stdout: string;
      stderr: string;
      error?: string;
      previewUrl?: string;
    }) => {
      if (result.stdout === "__CLEAR__") {
        setConsoleLines([]);
        return;
      }
      if (result.stdout.startsWith("__CWD__:")) {
        setShellCwd(result.stdout.slice("__CWD__:".length));
        return;
      }
      const lines: string[] = [];
      if (result.stdout) lines.push(result.stdout);
      if (result.stderr) lines.push(result.stderr);
      if (result.error) lines.push(result.error);
      if (lines.length) setConsoleLines((prev) => [...prev, ...lines]);
      if (result.previewUrl) {
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return result.previewUrl!;
        });
      }
    },
    []
  );

  const runCode = useCallback(async () => {
    if (running) return;
    if (!terminalVisible) setTerminalVisible(true);
    setTerminalCollapsed(false);
    terminalPanelRef.current?.expand();
    setRunning(true);
    setRuntimeStatus(
      getPythonRuntimeStatus() === "offline" ? "offline" : "running"
    );
    const record = vfsToRecord(vfsRef.current);
    let result =
      template === "python"
        ? await runViaDaytona(record, activeFile, {
            sessionId: daytonaSessionRef.current,
            journeyId,
            nodeId,
            scrimId: lessonScrimId ?? userScrimId,
            template,
          })
        : null;

    if (!result) {
      result = await runActiveFile(activeFile, record);
    } else if (result.sessionId) {
      daytonaSessionRef.current = result.sessionId;
    }
    const lines: string[] = [];
    if (result.stdout) lines.push(result.stdout);
    if (result.stderr) lines.push(result.stderr);
    if (result.error) lines.push(result.error);
    setConsoleLines((prev) => [...prev, ...lines]);
    if (result.previewUrl) {
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return result.previewUrl!;
      });
    }
    onOutput?.(result.error ?? result.stdout);
    setRunning(false);
    setRuntimeStatus(getPythonRuntimeStatus());
  }, [activeFile, journeyId, lessonScrimId, nodeId, onOutput, running, template, terminalVisible, userScrimId]);

  const runTerminalInput = useCallback(
    async (line: string) => {
      if (running) return;
      setConsoleLines((prev) => [...prev, `${terminalPrompt()} ${line}`]);
      setRunning(true);
      setRuntimeStatus("running");
      const result = await runTerminalLine(line, activeFile, {
        cwd: shellCwd,
        files: vfsToRecord(vfsRef.current),
        folderPaths: Object.keys(vfsRef.current).filter(
          (p) => vfsRef.current[p]?.isFolder || p.endsWith("/")
        ),
      });
      appendResult(result);
      setRunning(false);
      setRuntimeStatus(getPythonRuntimeStatus());
    },
    [activeFile, appendResult, running, shellCwd]
  );

  const terminalPrompt = () => (shellCwd ? `~/${shellCwd}$` : "$");

  const runCodeRef = useRef(runCode);
  runCodeRef.current = runCode;

  const onLayoutChanged = useCallback(
    (layout: { [id: string]: number }) => {
      if (terminalFullscreen) return;
      if (layout.editor != null && layout.terminal != null) {
        savedLayoutRef.current = {
          editor: layout.editor,
          terminal: layout.terminal,
        };
      }
    },
    [terminalFullscreen]
  );

  const toggleTerminalFullscreen = useCallback(() => {
    setTerminalFullscreen((prev) => {
      const next = !prev;
      if (!next) {
        requestAnimationFrame(() => {
          groupRef.current?.setLayout(savedLayoutRef.current);
        });
      }
      return next;
    });
    setTerminalCollapsed(false);
  }, [groupRef]);

  const toggleTerminalCollapse = useCallback(() => {
    setTerminalCollapsed((prev) => !prev);
  }, []);

  const consolePaneProps = {
    lines: consoleLines,
    status: (running ? "running" : runtimeStatus) as RuntimeStatus,
    collapsed: terminalCollapsed,
    fullscreen: terminalFullscreen,
    prompt: terminalPrompt(),
    previewUrl,
    onToggleCollapse: toggleTerminalCollapse,
    onToggleFullscreen: toggleTerminalFullscreen,
    onHide: () => {
      setTerminalFullscreen(false);
      setTerminalVisible(false);
    },
    onClear: () => {
      setConsoleLines([]);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    },
    onSubmitLine: (line: string) => void runTerminalInput(line),
    className: "h-full",
  };

  useEffect(() => {
    if (runSignal > 0) void runCodeRef.current();
  }, [runSignal]);

  const editorBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {terminalVisible ? (
        terminalFullscreen ? (
          <ConsolePane {...consolePaneProps} />
        ) : (
          <Group
            id="workspace-vertical"
            groupRef={groupRef}
            orientation="vertical"
            className="h-full min-h-0"
            defaultLayout={{ editor: 50, terminal: 50 }}
            onLayoutChanged={onLayoutChanged}
            resizeTargetMinimumSize={{ coarse: 28, fine: 12 }}
          >
            <Panel
              id="editor"
              defaultSize={50}
              minSize={0}
              maxSize={92}
              collapsible
              collapsedSize={0}
            >
              <EditorArea
                vfs={vfs}
                activeFile={activeFile}
                secondaryFile={secondaryFile}
                splitEnabled={splitEnabled}
                openTabs={openTabs}
                readOnly={readOnly}
                onSelectFile={selectFile}
                onCloseTab={closeTab}
                onChangeFile={updateFileContent}
                className="h-full"
              />
            </Panel>
            <ResizeSeparator orientation="vertical" />
            <Panel
              id="terminal"
              panelRef={terminalPanelRef}
              defaultSize={50}
              minSize={20}
              maxSize={95}
            >
              <ConsolePane {...consolePaneProps} />
            </Panel>
          </Group>
        )
      ) : (
        <EditorArea
          vfs={vfs}
          activeFile={activeFile}
          secondaryFile={secondaryFile}
          splitEnabled={splitEnabled}
          openTabs={openTabs}
          readOnly={readOnly}
          onSelectFile={selectFile}
          onCloseTab={closeTab}
          onChangeFile={updateFileContent}
          className="h-full flex-1"
        />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-[var(--canvas-dark)] text-[var(--on-dark)]",
        className
      )}
      style={scrimDockPx > 0 ? { paddingBottom: scrimDockPx } : undefined}
    >
      <WorkspaceToolbar
        title={title}
        breadcrumb={breadcrumb}
        template={template}
        running={running}
        runtimeStatus={runtimeStatus}
        runDisabled={runtimeStatus === "loading"}
        splitEnabled={splitEnabled}
        terminalVisible={terminalVisible}
        explorerVisible={explorerVisible}
        readOnly={readOnly}
        onRun={() => void runCode()}
        onToggleSplit={toggleSplit}
        onToggleTerminal={() => setTerminalVisible((v) => !v)}
        onToggleExplorer={() => setExplorerVisible((v) => !v)}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {editorBlock}

        <FileSidebar
          vfs={vfs}
          activeFile={activeFile}
          readOnly={readOnly}
          defaultLanguage={defaultLanguage}
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectFile={selectFile}
          onVfsChange={updateVfs}
          onSelectSlide={onSelectSlide}
          className={cn(
            "w-full shrink-0 border-t border-[var(--hairline-warm)] lg:w-[min(16rem,28vw)] lg:border-l lg:border-t-0",
            explorerVisible ? "flex" : "hidden lg:flex"
          )}
        />
      </div>
    </div>
  );
}
