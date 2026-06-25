import { formatRuntimeError } from "@/lib/playground/format-error";
import { isRunnable, languageFromPath } from "@/lib/playground/vfs";

export type RuntimeStatus = "loading" | "ready" | "offline" | "running";

export type RunResult = {
  stdout: string;
  stderr: string;
  error?: string;
  previewUrl?: string;
};

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<PyodideInstance>;
  }
}

let pyodidePromise: Promise<PyodideInstance> | null = null;
let pyodideStatus: RuntimeStatus = "loading";

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/";

function loadPyodideScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide runs in the browser only"));
  }
  if (window.loadPyodide) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-pyodide-loader="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Pyodide script failed to load")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.dataset.pyodideLoader = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Pyodide from CDN"));
    document.head.appendChild(script);
  });
}

export function getPythonRuntimeStatus(): RuntimeStatus {
  return pyodideStatus;
}

export async function ensurePyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodideStatus = "loading";
    pyodidePromise = (async () => {
      await loadPyodideScript();
      const loadPyodide = window.loadPyodide;
      if (!loadPyodide) {
        throw new Error("loadPyodide missing after script load");
      }
      const py = await loadPyodide({ indexURL: PYODIDE_CDN });
      pyodideStatus = "ready";
      return py;
    })().catch((err) => {
      pyodideStatus = "offline";
      pyodidePromise = null;
      throw err;
    });
  }
  return pyodidePromise;
}

function runJavaScriptInWorker(code: string): Promise<RunResult> {
  const workerSrc = `
    self.onmessage = (e) => {
      const logs = [];
      const console = {
        log: (...args) => logs.push(args.map((a) => String(a)).join(" ")),
        error: (...args) => logs.push(args.map((a) => String(a)).join(" ")),
      };
      try {
        const fn = new Function("console", e.data);
        fn(console);
        self.postMessage({ stdout: logs.join("\\n"), stderr: "" });
      } catch (err) {
        self.postMessage({
          stdout: logs.join("\\n"),
          stderr: "",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };
  `;
  const blob = new Blob([workerSrc], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const worker = new Worker(url);
    worker.onmessage = (e: MessageEvent<RunResult>) => {
      URL.revokeObjectURL(url);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = () => {
      URL.revokeObjectURL(url);
      worker.terminate();
      resolve({ stdout: "", stderr: "", error: "Worker failed to run code" });
    };
    worker.postMessage(code);
  });
}

function joinStdout(chunks: string[]): string {
  if (chunks.length === 0) return "";
  return chunks.map((c) => (c.endsWith("\n") ? c : `${c}\n`)).join("");
}

async function runPython(code: string): Promise<RunResult> {
  const py = await ensurePyodide();
  const stdout: string[] = [];
  const stderr: string[] = [];
  py.setStdout({ batched: (msg) => stdout.push(msg) });
  py.setStderr({ batched: (msg) => stderr.push(msg) });
  try {
    await py.runPythonAsync(code);
    const out = joinStdout(stdout);
    return {
      stdout: out || "(no output)",
      stderr: joinStdout(stderr),
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return {
      stdout: joinStdout(stdout),
      stderr: joinStdout(stderr),
      error: formatRuntimeError(raw, "python"),
    };
  }
}

function runHtmlPreview(code: string): RunResult {
  if (typeof window === "undefined") {
    return { stdout: "", stderr: "", error: "HTML preview needs a browser" };
  }
  const blob = new Blob([code], { type: "text/html" });
  const previewUrl = URL.createObjectURL(blob);
  return {
    stdout: "HTML preview ready — open the preview tab below.",
    stderr: "",
    previewUrl,
  };
}

function runJavaScript(code: string): Promise<RunResult> {
  return runJavaScriptInWorker(code).then((r) =>
    r.error
      ? { ...r, error: formatRuntimeError(r.error, "javascript") }
      : r
  );
}

/** Route execution by active file extension. */
export async function runActiveFile(
  activePath: string,
  files: Record<string, string>
): Promise<RunResult> {
  const code = files[activePath] ?? "";
  const lang = languageFromPath(activePath);
  const kind = isRunnable(activePath);

  if (kind === "python") return runPython(code);
  if (kind === "javascript") return runJavaScript(code);
  if (lang === "html") return runHtmlPreview(code);
  if (lang === "css") {
    return runHtmlPreview(
      `<style>${code}</style><p>CSS preview — styles applied to this page.</p>`
    );
  }

  return {
    stdout: "",
    stderr: "",
    error: `No in-browser runner for .${activePath.split(".").pop() ?? "?"}. Supported: .py, .js, .jsx, .html, .css`,
  };
}

export type ShellContext = {
  cwd: string;
  files: Record<string, string>;
  folderPaths: string[];
};

/** Mini shell + REPL for the terminal input line. */
function listShellDir(
  cwd: string,
  files: Record<string, string>,
  folderPaths: string[]
): string[] {
  const prefix = cwd ? `${cwd}/` : "";
  const names = new Set<string>();

  for (const p of Object.keys(files)) {
    if (cwd && !p.startsWith(prefix)) continue;
    const rel = cwd ? p.slice(prefix.length) : p;
    const seg = rel.split("/")[0];
    if (seg) names.add(seg);
  }

  for (const fp of folderPaths) {
    const f = fp.replace(/\/$/, "");
    if (cwd && f !== cwd && !f.startsWith(`${cwd}/`)) continue;
    if (!cwd) {
      const top = f.split("/")[0];
      if (top) names.add(top);
      continue;
    }
    if (f === cwd) continue;
    const rel = f.slice(cwd.length + 1);
    const seg = rel.split("/")[0];
    if (seg) names.add(seg);
  }

  return [...names].sort();
}

function resolveFileInCtx(
  name: string,
  ctx: ShellContext
): string | null {
  const candidates = [name, ctx.cwd ? `${ctx.cwd}/${name}` : name];
  for (const p of candidates) {
    if (Object.prototype.hasOwnProperty.call(ctx.files, p)) return p;
  }
  return null;
}

function resolveScriptFromShell(
  parts: string[],
  activePath: string,
  ctx: ShellContext
): string | null {
  const cmd = parts[0];
  if (cmd === "run") {
    const arg = parts[1];
    if (!arg) return activePath;
    return resolveFileInCtx(arg, ctx);
  }
  if (cmd === "python" || cmd === "python3" || cmd === "node") {
    const rest = parts.slice(1).filter((p) => p !== "run");
    if (rest[0] === "-c") return null;
    const named = rest.find((p) => p.includes("."));
    const file = named ?? rest[rest.length - 1];
    if (!file) return activePath;
    return resolveFileInCtx(file, ctx);
  }
  return null;
}

function shellOneLinerCode(parts: string[]): string | null {
  if (parts[1] !== "-c") return null;
  const raw = parts.slice(2).join(" ").trim();
  if (!raw) return null;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

export async function runTerminalLine(
  line: string,
  activePath: string,
  ctx: ShellContext
): Promise<RunResult> {
  const trimmed = line.trim();
  if (!trimmed) return { stdout: "", stderr: "" };

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  if (cmd === "clear") return { stdout: "__CLEAR__", stderr: "" };
  if (cmd === "help") {
    return {
      stdout: [
        "Shell: help, clear, pwd, ls, cd, echo, cat <file>",
        "Run: run [file] | python main.py | python3 main.py | node app.js",
        "Version: python --version",
        "Sign in + Daytona for full bash in the cloud sandbox.",
      ].join("\n"),
      stderr: "",
    };
  }
  if (cmd === "pwd") {
    return { stdout: ctx.cwd || "/", stderr: "" };
  }
  if (cmd === "echo") {
    return { stdout: parts.slice(1).join(" "), stderr: "" };
  }
  if (cmd === "ls") {
    const entries = listShellDir(ctx.cwd, ctx.files, ctx.folderPaths);
    return { stdout: entries.join("\n") || "(empty)", stderr: "" };
  }
  if (cmd === "cd") {
    const target = parts[1] ?? "";
    if (!target || target === "/") return { stdout: "__CWD__:", stderr: "" };
    if (target === "..") {
      const parent = ctx.cwd.split("/").filter(Boolean);
      parent.pop();
      return { stdout: `__CWD__:${parent.join("/")}`, stderr: "" };
    }
    const next = ctx.cwd ? `${ctx.cwd}/${target}` : target;
    return { stdout: `__CWD__:${next}`, stderr: "" };
  }
  if (cmd === "cat") {
    const name = parts[1];
    if (!name) return { stdout: "", stderr: "", error: "cat: missing file operand" };
    const path = resolveFileInCtx(name, ctx);
    if (!path) return { stdout: "", stderr: "", error: `cat: ${name}: No such file` };
    return { stdout: ctx.files[path] ?? "", stderr: "" };
  }

  if (cmd === "run" || cmd === "python" || cmd === "python3" || cmd === "node") {
    if (
      (cmd === "python" || cmd === "python3") &&
      (parts[1] === "-V" || parts[1] === "--version" || parts[1] === "-v")
    ) {
      return {
        stdout: "Python 3.12 (browser runtime — sign in for full shell via Daytona)",
        stderr: "",
      };
    }
    const inline = shellOneLinerCode(parts);
    if (inline && (cmd === "python" || cmd === "python3")) {
      return runPython(inline);
    }
    const path = resolveScriptFromShell(parts, activePath, ctx);
    if (!path) {
      return {
        stdout: "",
        stderr: "",
        error: `File not found. Try: run main.py  or  python main.py`,
      };
    }
    return runActiveFile(path, ctx.files);
  }

  const kind = isRunnable(activePath);
  if (kind === "python") return runPython(trimmed);
  if (kind === "javascript") return runJavaScript(trimmed);

  return {
    stdout: "",
    stderr: "",
    error: `Command not found: ${cmd}. Type help.`,
  };
}

// ponytail: self-check
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  const hint = formatRuntimeError("SyntaxError: unterminated string literal", "python");
  if (!hint.includes("String not closed")) throw new Error("formatRuntimeError regression");
}
