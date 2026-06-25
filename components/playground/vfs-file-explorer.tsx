"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  ChevronDown,
  FileCode2,
  FileJson2,
  FileText,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  buildVfsTree,
  folderKey,
  languageFromPath,
  moveVfsPath,
  uniqueFolderKey,
  uniquePath,
  type VfsState,
  type VfsTreeNode,
} from "@/lib/playground/vfs";
import { cn } from "@/lib/utils";

type VfsFileExplorerProps = {
  vfs: VfsState;
  activeFile: string;
  readOnly?: boolean;
  onSelect: (path: string) => void;
  onChange: (vfs: VfsState) => void;
  className?: string;
};

function FileIcon({ path }: { path: string }) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "py") {
    return <FileCode2 className="size-3.5 shrink-0 text-[var(--primary-active)]" />;
  }
  if (ext === "js" || ext === "ts" || ext === "tsx" || ext === "jsx") {
    return <FileCode2 className="size-3.5 shrink-0 text-[var(--link)]" />;
  }
  if (ext === "json") {
    return <FileJson2 className="size-3.5 shrink-0 text-[var(--skill-data)]" />;
  }
  return <FileText className="size-3.5 shrink-0 text-[var(--editor-text-muted)]" />;
}

export function VfsFileExplorer({
  vfs,
  activeFile,
  readOnly = false,
  onSelect,
  onChange,
  className,
}: VfsFileExplorerProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFolder, setNewFolder] = useState(false);
  const [folderValue, setFolderValue] = useState("");
  const [newFile, setNewFile] = useState(false);
  const [fileValue, setFileValue] = useState("");
  const [newFileInFolder, setNewFileInFolder] = useState<string | null>(null);
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [dropFolder, setDropFolder] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filePaths = Object.keys(vfs).filter(
    (p) => !vfs[p]?.isFolder && !p.endsWith("/")
  );
  const tree = buildVfsTree(vfs);

  const emit = (next: VfsState) => onChange(next);

  const normalizeName = (raw: string) => raw.trim() || "untitled";

  const toggleFolder = (path: string) => {
    const key = path.replace(/\/$/, "");
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  };

  const commitNewFolder = () => {
    const raw = folderValue.trim();
    setNewFolder(false);
    setFolderValue("");
    if (!raw) return;
    const key = uniqueFolderKey(vfs, raw);
    emit({
      ...vfs,
      [key]: { content: "", language: "plaintext", isFolder: true },
    });
    setExpanded((e) => ({ ...e, [key.replace(/\/$/, "")]: true }));
  };

  const commitNewFile = (parentFolder = "") => {
    const raw = normalizeName(fileValue);
    setNewFile(false);
    setNewFileInFolder(null);
    setFileValue("");
    const base = parentFolder
      ? `${parentFolder.replace(/\/$/, "")}/${raw}`
      : raw;
    const path = uniquePath(vfs, base);
    emit({
      ...vfs,
      [path]: { content: "", language: languageFromPath(path) },
    });
    onSelect(path);
  };

  const deleteEntry = (path: string, isFolder: boolean) => {
    const next = { ...vfs };
    if (isFolder) {
      const prefix = path.replace(/\/$/, "");
      for (const p of Object.keys(next)) {
        if (p === path || p.startsWith(`${prefix}/`)) delete next[p];
      }
    } else {
      if (filePaths.length <= 1) return;
      delete next[path];
    }
    emit(next);
    if (!isFolder && activeFile === path) {
      const remaining = Object.keys(next).find(
        (p) => !next[p]?.isFolder && !p.endsWith("/")
      );
      if (remaining) onSelect(remaining);
    }
  };

  const startRename = (path: string) => {
    setRenaming(path);
    setRenameValue(path.endsWith("/") ? path.slice(0, -1) : path);
  };

  const commitRename = () => {
    if (!renaming || !renameValue.trim()) {
      setRenaming(null);
      return;
    }
    const isFolder = renaming.endsWith("/") || vfs[renaming]?.isFolder;
    const nextPath = isFolder ? folderKey(renameValue.trim()) : renameValue.trim();
    if (nextPath === renaming || vfs[nextPath]) {
      setRenaming(null);
      return;
    }
    const next = { ...vfs };
    if (isFolder) {
      const oldPrefix = renaming.replace(/\/$/, "");
      const newPrefix = nextPath.replace(/\/$/, "");
      for (const p of Object.keys(next)) {
        if (p === renaming) {
          next[nextPath] = next[p];
          delete next[p];
        } else if (p.startsWith(`${oldPrefix}/`)) {
          const moved = `${newPrefix}/${p.slice(oldPrefix.length + 1)}`;
          next[moved] = { ...next[p], language: languageFromPath(moved) };
          delete next[p];
        }
      }
    } else {
      next[nextPath] = {
        ...next[renaming],
        language: languageFromPath(nextPath),
      };
      delete next[renaming];
    }
    emit(next);
    if (activeFile === renaming) onSelect(nextPath);
    setRenaming(null);
  };

  const onDropOnFolder = (folderPath: string) => {
    if (!dragPath) return;
    const moved = moveVfsPath(vfs, dragPath, folderPath.replace(/\/$/, ""));
    if (moved) {
      emit(moved);
      if (activeFile === dragPath) {
        const name = dragPath.split("/").pop()!;
        const dest = folderPath.replace(/\/$/, "");
        onSelect(dest ? `${dest}/${name}` : name);
      }
    }
    setDragPath(null);
    setDropFolder(null);
  };

  const renderNode = (node: VfsTreeNode, depth = 0): ReactNode => {
    if (node.type === "folder") {
      const folderPath = node.path;
      const folderId = folderPath.replace(/\/$/, "");
      const isOpen = expanded[folderId] ?? true;
      const isDrop = dropFolder === folderPath;

      return (
        <li key={folderPath || "root"}>
          <div
            className={cn(
              "flex items-center gap-1 rounded-md px-1 py-0.5",
              isDrop && "bg-[var(--primary)]/20 ring-1 ring-[var(--primary)]"
            )}
            style={{ paddingLeft: depth * 10 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDropFolder(folderPath);
            }}
            onDragLeave={() => setDropFolder(null)}
            onDrop={(e) => {
              e.preventDefault();
              onDropOnFolder(folderPath);
            }}
          >
            <button
              type="button"
              onClick={() => toggleFolder(folderPath)}
              className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-xs text-[var(--on-dark-mute)]"
            >
              <ChevronDown
                className={cn(
                  "size-3 shrink-0 transition-transform",
                  !isOpen && "-rotate-90"
                )}
              />
              <Folder className="size-3.5 shrink-0 text-[var(--primary)]/80" />
              <span className="truncate font-mono">{node.name || "project"}</span>
            </button>
            {!readOnly && (
              <div className="flex shrink-0">
                <button
                  type="button"
                  aria-label="New file in folder"
                  onClick={() => {
                    setNewFileInFolder(folderPath);
                    setFileValue("");
                  }}
                  className="rounded p-1 text-[var(--on-dark-mute)] hover:text-[var(--on-dark)]"
                >
                  <Plus className="size-3" />
                </button>
                {folderPath && (
                  <>
                    <button
                      type="button"
                      onClick={() => startRename(folderPath)}
                      className="rounded p-1 text-[var(--on-dark-mute)] hover:text-[var(--on-dark)]"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEntry(folderPath, true)}
                      className="rounded p-1 text-[var(--on-dark-mute)] hover:text-red-400"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {newFileInFolder === folderPath && !readOnly && (
            <input
              autoFocus
              value={fileValue}
              onChange={(e) => setFileValue(e.target.value)}
              onBlur={() => commitNewFile(folderPath)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewFile(folderPath);
                if (e.key === "Escape") {
                  setNewFileInFolder(null);
                  setFileValue("");
                }
              }}
              placeholder="filename"
              className="mx-1 mb-1 rounded bg-[var(--surface-dark)] px-2 py-1 font-mono text-xs text-[var(--editor-text)] outline-none ring-1 ring-[var(--primary)]"
              style={{ marginLeft: depth * 10 + 20 }}
            />
          )}
          {isOpen && node.children.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    }

    const path = node.path;
    return (
      <li key={path}>
        {renaming === path ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(null);
            }}
            className="w-full rounded bg-[var(--surface-dark)] px-2 py-1 font-mono text-xs text-[var(--editor-text)] outline-none ring-1 ring-[var(--primary)]"
            style={{ marginLeft: depth * 10 }}
          />
        ) : (
          <div
            draggable={!readOnly}
            onDragStart={() => setDragPath(path)}
            onDragEnd={() => {
              setDragPath(null);
              setDropFolder(null);
            }}
            className={cn(
              "flex items-center gap-1 rounded-md px-1.5 py-1",
              activeFile === path
                ? "bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]/35"
                : "hover:bg-[var(--surface-dark-soft)]"
            )}
            style={{ marginLeft: depth * 10 }}
          >
            <button
              type="button"
              onClick={() => onSelect(path)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs",
                activeFile === path ? "text-[var(--editor-text)]" : "text-[var(--editor-text-muted)]"
              )}
            >
              <FileIcon path={path} />
              <span className="truncate font-mono">{node.name}</span>
            </button>
            {!readOnly && (
              <div className="flex shrink-0">
                <button
                  type="button"
                  onClick={() => startRename(path)}
                  className="rounded p-1 text-[var(--on-dark-mute)] hover:text-[var(--on-dark)]"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteEntry(path, false)}
                  disabled={filePaths.length <= 1}
                  className="rounded p-1 text-[var(--on-dark-mute)] hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {!readOnly && (
        <div className="flex items-center justify-end gap-0.5 px-1">
          <button
            type="button"
            onClick={() => {
              setNewFolder(true);
              setFolderValue("");
            }}
            aria-label="New folder"
            className="rounded-md p-1 text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--editor-text)]"
          >
            <FolderPlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setNewFile(true);
              setFileValue("");
            }}
            aria-label="New file"
            className="rounded-md p-1 text-[var(--editor-text-muted)] hover:bg-[var(--surface-dark-soft)] hover:text-[var(--editor-text)]"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      )}

      {newFolder && !readOnly && (
        <input
          autoFocus
          value={folderValue}
          onChange={(e) => setFolderValue(e.target.value)}
          onBlur={commitNewFolder}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitNewFolder();
            if (e.key === "Escape") {
              setNewFolder(false);
              setFolderValue("");
            }
          }}
          placeholder="folder name"
          className="mx-1 rounded bg-[var(--surface-dark)] px-2 py-1 font-mono text-xs text-[var(--editor-text)] outline-none ring-1 ring-[var(--primary)]"
        />
      )}

      {newFile && !readOnly && (
        <input
          autoFocus
          value={fileValue}
          onChange={(e) => setFileValue(e.target.value)}
          onBlur={() => commitNewFile()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitNewFile();
            if (e.key === "Escape") {
              setNewFile(false);
              setFileValue("");
            }
          }}
          placeholder="filename"
          className="mx-1 rounded bg-[var(--surface-dark)] px-2 py-1 font-mono text-xs text-[var(--editor-text)] outline-none ring-1 ring-[var(--primary)]"
        />
      )}

      <ul className="flex flex-col gap-0.5 overflow-y-auto">
        {tree.map((node) => renderNode(node))}
      </ul>
    </div>
  );
}
