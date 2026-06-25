export type VfsFile = {
  content: string;
  language: string;
  /** Virtual folder — not a runnable file. */
  isFolder?: boolean;
};

export type VfsState = Record<string, VfsFile>;

const EXT_LANG: Record<string, string> = {
  py: "python",
  js: "javascript",
  mjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  go: "go",
};

export function languageFromPath(path: string): string {
  if (path.endsWith("/")) return "plaintext";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (!ext || ext === path) return "plaintext";
  return EXT_LANG[ext] ?? "plaintext";
}

export function vfsFromRecord(files: Record<string, string>): VfsState {
  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path,
      { content, language: languageFromPath(path) },
    ])
  );
}

export function vfsToRecord(vfs: VfsState): Record<string, string> {
  return Object.fromEntries(
    Object.entries(vfs)
      .filter(([, file]) => !file.isFolder)
      .map(([path, file]) => [path, file.content])
  );
}

export function fileRecordKey(files: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(files)
      .sort()
      .map((k) => [k, files[k]])
  );
}

export function fileRecordsEqual(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  return fileRecordKey(a) === fileRecordKey(b);
}

export function defaultFilename(): string {
  return "untitled.txt";
}

export function uniquePath(vfs: VfsState, base: string): string {
  if (!vfs[base]) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const suffix = dot > 0 ? base.slice(dot) : "";
  let i = 2;
  while (vfs[`${stem}-${i}${suffix}`]) i += 1;
  return `${stem}-${i}${suffix}`;
}

export function folderKey(name: string): string {
  return `${name.replace(/[/\\]+/g, "").replace(/\/$/, "")}/`;
}

export function uniqueFolderKey(vfs: VfsState, base: string): string {
  const clean = base.replace(/[/\\]+/g, "").replace(/\/$/, "");
  const key = folderKey(clean);
  if (!vfs[key]) return key;
  let i = 2;
  while (vfs[folderKey(`${clean}-${i}`)]) i += 1;
  return folderKey(`${clean}-${i}`);
}

export function isRunnable(path: string): "python" | "javascript" | null {
  if (path.endsWith("/")) return null;
  const lang = languageFromPath(path);
  if (lang === "python") return "python";
  if (lang === "javascript") return "javascript";
  return null;
}

export type VfsTreeFolder = {
  type: "folder";
  path: string;
  name: string;
  children: VfsTreeNode[];
};

export type VfsTreeFile = {
  type: "file";
  path: string;
  name: string;
};

export type VfsTreeNode = VfsTreeFolder | VfsTreeFile;

/** Build explorer tree from flat paths + folder markers. */
export function buildVfsTree(vfs: VfsState): VfsTreeNode[] {
  const root: VfsTreeFolder = { type: "folder", path: "", name: "", children: [] };
  const folderMap = new Map<string, VfsTreeFolder>();
  folderMap.set("", root);

  const ensureFolder = (folderPath: string): VfsTreeFolder => {
    const key = folderPath ? `${folderPath}/` : "";
    const existing = folderMap.get(folderPath);
    if (existing) return existing;

    const name = folderPath.split("/").pop() ?? folderPath;
    const parentPath = folderPath.includes("/")
      ? folderPath.slice(0, folderPath.lastIndexOf("/"))
      : "";
    const parent = ensureFolder(parentPath);
    const node: VfsTreeFolder = {
      type: "folder",
      path: key,
      name,
      children: [],
    };
    parent.children.push(node);
    folderMap.set(folderPath, node);
    return node;
  };

  for (const path of Object.keys(vfs)) {
    if (vfs[path]?.isFolder || path.endsWith("/")) {
      const folderPath = path.replace(/\/$/, "");
      ensureFolder(folderPath);
      continue;
    }
    const slash = path.lastIndexOf("/");
    const parentPath = slash >= 0 ? path.slice(0, slash) : "";
    const parent = ensureFolder(parentPath);
    parent.children.push({
      type: "file",
      path,
      name: path.slice(slash + 1),
    });
  }

  const sortNodes = (nodes: VfsTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.type === "folder") sortNodes(n.children);
    }
  };
  sortNodes(root.children);
  return root.children;
}

export function moveVfsPath(
  vfs: VfsState,
  fromPath: string,
  toFolderPath: string
): VfsState | null {
  if (fromPath.endsWith("/") || vfs[fromPath]?.isFolder) return null;
  const fileName = fromPath.split("/").pop();
  if (!fileName) return null;
  const destFolder = toFolderPath.replace(/\/$/, "");
  const newPath = destFolder ? `${destFolder}/${fileName}` : fileName;
  if (newPath === fromPath || vfs[newPath]) return null;
  const next = { ...vfs };
  next[newPath] = { ...next[fromPath], language: languageFromPath(newPath) };
  delete next[fromPath];
  return next;
}

export function listFilePaths(vfs: VfsState): string[] {
  return Object.keys(vfs).filter((p) => !vfs[p]?.isFolder && !p.endsWith("/"));
}
