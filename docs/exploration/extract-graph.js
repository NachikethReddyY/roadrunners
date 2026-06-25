#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-shot dependency extractor for RoadRunners codebase.
 * Writes exploration-data.json to the same directory.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(__dirname, "exploration-data.json");

const IGNORE = new Set([
  "node_modules",
  ".next",
  ".git",
  "docs/exploration",
]);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (ent.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|jsx?|mjs)$/.test(ent.name)) acc.push(rel);
  }
  return acc;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith("@/")) return null;
  const base = spec.slice(2);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];
  for (const c of candidates) {
    const abs = path.join(ROOT, c);
    if (fs.existsSync(abs)) return c.replace(/\\/g, "/");
  }
  return base.replace(/\\/g, "/");
}

function classify(rel) {
  if (rel.startsWith("app/") && rel.includes("/page.")) return "route";
  if (rel.startsWith("app/") && rel.includes("/route.")) return "route";
  if (rel.startsWith("app/api/")) return "route";
  if (rel === "proxy.ts") return "config";
  if (rel.startsWith("lib/actions/")) return "service";
  if (rel.startsWith("lib/supabase/")) return "service";
  if (rel.startsWith("lib/ai/")) return "service";
  if (rel.startsWith("lib/schemas/")) return "util";
  if (rel.startsWith("lib/gamification/")) return "util";
  if (rel.startsWith("lib/constants/")) return "config";
  if (rel.startsWith("lib/")) return "util";
  if (rel.startsWith("components/ui/")) return "component";
  if (rel.startsWith("components/")) return "component";
  if (rel.startsWith("types/")) return "util";
  if (rel.endsWith(".config.ts") || rel.endsWith(".config.mjs")) return "config";
  if (rel.startsWith("supabase/")) return "db";
  return "util";
}

function extractExports(content) {
  const names = [];
  const re = /export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+(\w+)|export\s*\{\s*([^}]+)\}/g;
  let m;
  while ((m = re.exec(content))) {
    if (m[1]) names.push(m[1]);
    if (m[2]) {
      m[2].split(",").forEach((part) => {
        const n = part.trim().split(/\s+as\s+/)[0].trim();
        if (n && n !== "type") names.push(n);
      });
    }
  }
  if (/export\s+default/.test(content)) names.push("default");
  if (/export\s+\*/.test(content)) names.push("*");
  return [...new Set(names)].slice(0, 12);
}

function extractFunctions(content) {
  const fns = [];
  const re = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
  let m;
  while ((m = re.exec(content))) fns.push(`${m[1]}()`);
  return [...new Set(fns)].slice(0, 8);
}

function extractImports(content, fromFile) {
  const specs = [];
  const re = /import\s+(?:type\s+)?(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
  let m;
  while ((m = re.exec(content))) {
    const spec = m[1] || m[2];
    if (spec.startsWith("@/")) {
      const resolved = resolveImport(fromFile, spec);
      if (resolved) specs.push(resolved);
    }
  }
  return [...new Set(specs)];
}

function purpose(rel, type) {
  const map = {
    "proxy.ts": "Next.js proxy entry: delegates session refresh and private-route redirects.",
    "lib/constants/routes.ts": "Single source of truth for route paths and public/auth route lists.",
    "lib/supabase/server.ts": "Server-side Supabase client (cookies). Used by pages, actions, API routes.",
    "lib/supabase/middleware.ts": "Session refresh + redirect logic invoked from the root proxy.",
    "lib/actions/auth.ts": "Server actions: Google OAuth, magic link, sign out.",
    "lib/actions/onboarding.ts": "Creates profile + first journey after 2-step onboarding wizard.",
    "lib/actions/journey.ts": "Choice submit, acknowledge, pivot, XP/streak updates via Supabase.",
    "lib/ai/fallback.ts": "Deterministic AI node template when LLM unavailable or invalid.",
    "lib/ai/generate-node.ts": "OpenAI/Gemini structured next-node generation with Zod validation.",
    "lib/ai/create-next-node.ts": "Loads journey context, generates or falls back, then persists through Supabase RPC.",
    "app/api/ai/next-node/route.ts": "Authenticated endpoint: validates, rate-limits, generates, and persists the next node.",
    "supabase/migrations/001_initial.sql": "PostgreSQL schema: profiles, journeys, nodes, choices, RLS policies.",
    "docs/design/DESIGN.md": "RoadRunners design system: colors, typography, components.",
    "docs/tasks/01-product-journey.md": "Work package for roadmap UX, choices, completion presentation, map, coverage, and XP.",
    "docs/tasks/02-runtime-intelligence.md": "Work package for AI, guides, scrims, Daytona, verification, workspace, and TTS.",
    "docs/tasks/03-platform-data.md": "Work package for contracts, Supabase, Auth, RLS, persistence, and migrations.",
  };
  if (map[rel]) return map[rel];
  if (type === "route") return `Next.js App Router page or API handler at ${rel.replace(/^app\//, "/").replace(/\/page\.tsx$/, "").replace(/\/route\.ts$/, "")}`;
  if (type === "component") return `React UI component: ${path.basename(rel)}`;
  if (type === "service") return `Server-side logic: ${path.basename(rel)}`;
  if (type === "util") return `Shared utilities/schemas: ${path.basename(rel)}`;
  if (type === "config") return `Configuration: ${path.basename(rel)}`;
  if (type === "db") return `Database migration or seed data.`;
  return rel;
}

const files = walk(ROOT).filter(
  (f) =>
    !f.startsWith("docs/exploration/") &&
    f !== "next-env.d.ts" &&
    !f.startsWith("eslint") &&
    !f.startsWith("postcss")
);

const fileData = {};
for (const rel of files) {
  const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
  fileData[rel] = {
    imports: extractImports(content, rel),
    exports: extractExports(content),
    keyFunctions: extractFunctions(content),
    type: classify(rel),
  };
}

const edges = [];
const inbound = {};
const outbound = {};

for (const [src, data] of Object.entries(fileData)) {
  outbound[src] = data.imports.length;
  for (const tgt of data.imports) {
    edges.push({ source: src, target: tgt, type: "import" });
    inbound[tgt] = (inbound[tgt] || 0) + 1;
  }
}

// Route → handler edges (conceptual)
const routeEdges = [
  ["app/page.tsx", "proxy.ts", "proxy"],
  ["app/login/page.tsx", "components/auth/login-form.tsx", "renders"],
  ["app/roadmap/new/page.tsx", "lib/actions/roadmap.ts", "uses"],
  ["app/journey/[id]/page.tsx", "lib/actions/journey.ts", "uses"],
  ["app/api/ai/next-node/route.ts", "lib/ai/create-next-node.ts", "uses"],
  ["proxy.ts", "lib/supabase/middleware.ts", "delegates"],
];
for (const [s, t, type] of routeEdges) {
  if (fileData[s] && (fileData[t] || t.startsWith("lib/"))) {
    edges.push({ source: s, target: t, type });
  }
}

// DB table references
const dbRefs = {
  "lib/actions/journey.ts": ["profiles", "journeys", "journey_nodes", "decisions"],
  "lib/actions/onboarding.ts": ["profiles", "journeys"],
  "app/api/ai/next-node/route.ts": ["journeys"],
  "app/journey/page.tsx": ["journeys"],
  "app/journey/[id]/page.tsx": ["journeys", "journey_nodes", "journey_choices"],
};
for (const [src, tables] of Object.entries(dbRefs)) {
  for (const table of tables) {
    const tgt = `supabase/migrations/001_initial.sql#${table}`;
    edges.push({ source: src, target: tgt, type: "db" });
  }
}

const allNodeIds = new Set([
  ...Object.keys(fileData),
  ...edges.map((e) => e.target),
]);

const dependents = {};
for (const e of edges) {
  if (e.type !== "import") continue;
  if (!dependents[e.target]) dependents[e.target] = [];
  if (!dependents[e.target].includes(e.source)) dependents[e.target].push(e.source);
}

const nodes = [...allNodeIds].map((id) => {
  const isDb = id.includes("#");
  const rel = isDb ? "supabase/migrations/001_initial.sql" : id;
  const data = fileData[rel] || {};
  const type = isDb ? "db" : data.type || "util";
  const inCount = inbound[id] || 0;
  const outCount = isDb ? 0 : outbound[id] || 0;
  return {
    id,
    label: path.basename(id.split("#")[0]),
    type,
    path: id,
    imports: data.imports || [],
    exports: data.exports || (isDb ? [id.split("#")[1]] : []),
    keyFunctions: data.keyFunctions || [],
    connected: inCount + outCount,
    dependents: (dependents[id] || []).slice(0, 8),
    purpose: isDb ? `PostgreSQL table: ${id.split("#")[1]}` : purpose(id, type),
  };
});

const hotspots = nodes
  .filter((n) => !n.path.includes("#"))
  .map((n) => ({
    file: n.path,
    inbound: inbound[n.path] || 0,
    outbound: outbound[n.path] || 0,
    total: (inbound[n.path] || 0) + (outbound[n.path] || 0),
  }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 15);

const deadAreas = nodes
  .filter(
    (n) =>
      !n.path.includes("#") &&
      (inbound[n.path] || 0) === 0 &&
      !n.path.startsWith("app/") &&
      n.path !== "proxy.ts"
  )
  .map((n) => n.path);

// Simple cycle detection (2-3 node cycles)
function findCycles() {
  const adj = {};
  for (const e of edges.filter((e) => e.type === "import")) {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  }
  const cycles = [];
  const seen = new Set();
  function dfs(node, stack) {
    if (stack.includes(node)) {
      const i = stack.indexOf(node);
      cycles.push([...stack.slice(i), node]);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    for (const next of adj[node] || []) dfs(next, [...stack, node]);
  }
  for (const n of Object.keys(adj)) dfs(n, []);
  return cycles.slice(0, 5).map((cycle) => ({ cycle }));
}

const criticalPaths = [
  {
    name: "Auth Flow",
    path: [
      "app/login/page.tsx",
      "components/auth/login-form.tsx",
      "lib/actions/auth.ts",
      "app/auth/callback/route.ts",
      "lib/supabase/server.ts",
      "proxy.ts",
      "lib/supabase/middleware.ts",
    ],
  },
  {
    name: "Roadmap Creation → First Node",
    path: [
      "app/roadmap/new/page.tsx",
      "components/roadmap/goal-creator.tsx",
      "lib/actions/roadmap.ts",
      "lib/schemas/roadmap.ts",
      "lib/supabase/server.ts",
      "lib/ai/create-next-node.ts",
      "supabase/migrations/001_initial.sql#profiles",
      "supabase/migrations/001_initial.sql#journeys",
    ],
  },
  {
    name: "Journey Choice + XP",
    path: [
      "app/journey/[id]/page.tsx",
      "components/journey/choice-panel.tsx",
      "lib/actions/journey.ts",
      "lib/gamification/xp.ts",
      "lib/gamification/streak.ts",
      "supabase/migrations/001_initial.sql#decisions",
    ],
  },
  {
    name: "AI Next Node",
    path: [
      "app/api/ai/next-node/route.ts",
      "lib/schemas/ai.ts",
      "lib/ai/create-next-node.ts",
      "lib/ai/generate-node.ts",
      "lib/ai/fallback.ts",
      "lib/supabase/server.ts",
    ],
  },
];

const onboardingPaths = {
  "New Engineer": [
    "docs/tasks/01-product-journey.md",
    "docs/tasks/02-runtime-intelligence.md",
    "docs/tasks/03-platform-data.md",
    "app/layout.tsx",
    "proxy.ts",
    "lib/constants/routes.ts",
    "lib/supabase/server.ts",
    "app/roadmap/new/page.tsx",
    "lib/actions/journey.ts",
    "supabase/migrations/001_initial.sql",
  ],
  Frontend: [
    "docs/tasks/01-product-journey.md",
    "app/layout.tsx",
    "components/layout/app-shell.tsx",
    "components/journey/journey-node-card.tsx",
    "components/roadmap/goal-creator.tsx",
    "components/playground/playground-shell.tsx",
    "docs/design/DESIGN.md",
  ],
  Runtime: [
    "docs/tasks/02-runtime-intelligence.md",
    "app/api/ai/next-node/route.ts",
    "lib/ai/create-next-node.ts",
    "lib/ai/generate-node.ts",
    "lib/daytona/client.ts",
    "app/api/runner/exec/route.ts",
  ],
  Platform: [
    "docs/tasks/03-platform-data.md",
    "supabase/migrations/001_initial.sql",
    "supabase/migrations/004_scrim_sessions.sql",
    "supabase/seed.sql",
    "types/database.ts",
    "lib/schemas/journey.ts",
  ],
  Authentication: [
    "proxy.ts",
    "lib/supabase/middleware.ts",
    "lib/actions/auth.ts",
    "app/auth/callback/route.ts",
    "components/auth/login-form.tsx",
  ],
  Design: [
    "docs/design/DESIGN.md",
    "docs/design/preview.html",
    "app/globals.css",
    "components/brand/logo.tsx",
  ],
};

const graph = {
  projectName: "RoadRunners",
  nodes,
  edges,
  hotspots,
  criticalPaths,
  onboardingPaths,
  deadAreas: deadAreas.slice(0, 20),
  circularDeps: findCycles(),
  categories: {
    component: { color: "#3b82f6", shape: "round-rectangle" },
    service: { color: "#8b5cf6", shape: "hexagon" },
    route: { color: "#10b981", shape: "rectangle" },
    context: { color: "#f59e0b", shape: "round-rectangle" },
    util: { color: "#6b7280", shape: "ellipse" },
    config: { color: "#ef4444", shape: "diamond" },
    db: { color: "#06b6d4", shape: "cylinder" },
    hook: { color: "#ec4899", shape: "round-rectangle" },
  },
};

fs.writeFileSync(OUT, JSON.stringify(graph, null, 2));

const reportPath = path.join(__dirname, "exploration-report.html");
if (fs.existsSync(reportPath)) {
  const report = fs.readFileSync(reportPath, "utf8");
  const start = report.indexOf("const DATA = ");
  const end = report.indexOf(";", start);
  if (start >= 0 && end >= 0) {
    const synchronized =
      report.slice(0, start) +
      `const DATA = ${JSON.stringify(graph)}` +
      report.slice(end);
    fs.writeFileSync(reportPath, synchronized);
  }
}

console.log(
  `Wrote ${OUT} and synchronized exploration-report.html (${nodes.length} nodes, ${edges.length} edges)`
);
