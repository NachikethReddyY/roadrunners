"use client";

import { Play, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { PlaygroundConfig } from "@/lib/schemas/playground";
import { cn } from "@/lib/utils";

type PythonWorkspaceProps = {
  files: Record<string, string>;
  activeFile?: string | null;
  readOnly?: boolean;
  onFilesChange?: (files: Record<string, string>) => void;
  onOutput?: (output: string) => void;
  className?: string;
};

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
};

export function PythonWorkspace({
  files,
  activeFile,
  readOnly = false,
  onFilesChange,
  onOutput,
  className,
}: PythonWorkspaceProps) {
  const fileKeys = Object.keys(files);
  const initialActive =
    activeFile && files[activeFile]
      ? activeFile
      : fileKeys[0] ?? "main.py";

  const [selectedFile, setSelectedFile] = useState(initialActive);
  const [localFiles, setLocalFiles] = useState(files);
  const [consoleOut, setConsoleOut] = useState<string[]>([]);
  const [pyodide, setPyodide] = useState<PyodideInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  useEffect(() => {
    let cancelled = false;

    async function loadPyodide() {
      try {
        const { loadPyodide } = await import("pyodide");
        const py = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.6/full/",
        });
        if (!cancelled) {
          setPyodide(py as unknown as PyodideInstance);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setConsoleOut(["Failed to load Python runtime. Check your connection."]);
          setLoading(false);
        }
      }
    }

    loadPyodide();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFile = useCallback(
    (path: string, code: string) => {
      if (readOnly) return;
      const next = { ...localFiles, [path]: code };
      setLocalFiles(next);
      onFilesChange?.(next);
    },
    [localFiles, onFilesChange, readOnly]
  );

  const runCode = useCallback(async () => {
    if (!pyodide || running) return;
    setRunning(true);
    const lines: string[] = [];

    pyodide.setStdout({ batched: (msg) => lines.push(msg) });
    pyodide.setStderr({ batched: (msg) => lines.push(msg) });

    try {
      const code = localFiles[selectedFile] ?? "";
      await pyodide.runPythonAsync(code);
      const output = lines.length > 0 ? lines.join("") : "(no output)";
      setConsoleOut((prev) => [...prev, `> ${output}`]);
      onOutput?.(output);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setConsoleOut((prev) => [...prev, `Error: ${msg}`]);
      onOutput?.(msg);
    } finally {
      setRunning(false);
    }
  }, [pyodide, running, localFiles, selectedFile, onOutput]);

  return (
    <div
      className={cn(
        "flex h-full min-h-[360px] flex-col bg-[var(--surface-dark)] text-[var(--on-dark)]",
        className
      )}
    >
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-36 shrink-0 border-r border-[var(--hairline-warm)] p-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--on-dark-mute)]">
            Files
          </p>
          {fileKeys.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => setSelectedFile(path)}
              className={cn(
                "mb-1 block w-full truncate rounded px-2 py-1.5 text-left text-xs",
                selectedFile === path
                  ? "bg-[var(--surface-dark-soft)] text-[var(--on-dark)]"
                  : "text-[var(--on-dark-mute)] hover:bg-[var(--surface-dark-soft)]"
              )}
            >
              {path}
            </button>
          ))}
        </aside>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--hairline-warm)] px-3 py-1.5">
            <span className="font-mono text-xs text-[var(--on-dark-mute)]">
              {selectedFile}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={runCode}
                disabled={loading || running}
                className="flex h-8 items-center gap-1 rounded-full bg-[var(--primary)] px-3 text-xs font-medium text-white hover:bg-[var(--primary-active)] disabled:opacity-50"
              >
                <Play className="size-3.5" />
                {loading ? "Loading…" : running ? "Running…" : "Run"}
              </button>
            )}
          </div>
          <textarea
            value={localFiles[selectedFile] ?? ""}
            onChange={(e) => updateFile(selectedFile, e.target.value)}
            readOnly={readOnly}
            spellCheck={false}
            className="min-h-[200px] flex-1 resize-none bg-[var(--canvas-dark)] p-4 font-mono text-sm leading-relaxed text-[var(--on-dark)] outline-none"
          />
        </div>
      </div>
      <div className="border-t border-[var(--hairline-warm)]">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--on-dark-mute)]">
            Console
          </span>
          <button
            type="button"
            onClick={() => setConsoleOut([])}
            aria-label="Clear console"
            className="text-[var(--on-dark-mute)] hover:text-[var(--on-dark)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <pre className="max-h-28 overflow-auto px-3 pb-3 font-mono text-xs text-[var(--on-dark-mute)]">
          {consoleOut.length === 0 ? "> " : consoleOut.join("\n")}
        </pre>
      </div>
    </div>
  );
}
