import test from "node:test";
import assert from "node:assert/strict";
import { buildFrontierView, combineJourneyCoverage } from "./frontier-view.ts";

const baseNode = {
  id: "node-1",
  title: "Build event listing page",
  node_type: "lesson",
  skill_tag: "react",
};

test("archived node appears in deferred frontier with archived state", () => {
  const { frontier, nodes } = buildFrontierView({
    nodes: [{ ...baseNode, archived_at: "2026-01-01T00:00:00Z" }],
    currentNodeId: null,
    takenNodeIds: [],
  });
  assert.equal(nodes[0].state, "archived");
  assert.ok(frontier.deferred.includes("node-1"));
});

test("current node appears in unlocked frontier", () => {
  const { frontier, nodes } = buildFrontierView({
    nodes: [baseNode],
    currentNodeId: "node-1",
    takenNodeIds: [],
  });
  assert.equal(nodes[0].state, "current");
  assert.ok(frontier.unlocked.includes("node-1"));
});

test("completed node appears in taken frontier", () => {
  const { frontier, nodes } = buildFrontierView({
    nodes: [baseNode],
    currentNodeId: null,
    takenNodeIds: ["node-1"],
  });
  assert.equal(nodes[0].state, "complete");
  assert.ok(frontier.taken.includes("node-1"));
});

test("future node appears in locked frontier", () => {
  const { frontier, nodes } = buildFrontierView({
    nodes: [baseNode],
    currentNodeId: null,
    takenNodeIds: [],
  });
  assert.equal(nodes[0].state, "future");
  assert.ok(frontier.locked.includes("node-1"));
});

test("parent-child relationships are preserved in map nodes", () => {
  const { nodes } = buildFrontierView({
    nodes: [
      { id: "root", title: "Root checkpoint", node_type: "lesson" },
      { id: "child", title: "Child checkpoint", node_type: "lesson", parent_id: "root" },
    ],
    currentNodeId: null,
    takenNodeIds: [],
  });
  assert.equal(nodes[0].parentId, null);
  assert.equal(nodes[1].parentId, "root");
});

test("completed build checkpoint coverage is practiced", () => {
  const { nodes } = buildFrontierView({
    nodes: [{ ...baseNode, node_type: "interactive", playground_config: { lang: "js" } }],
    currentNodeId: null,
    takenNodeIds: ["node-1"],
  });
  assert.equal(nodes[0].mode, "build");
  assert.ok(nodes[0].coverage.length > 0, "build node should produce coverage items");
  assert.ok(
    nodes[0].coverage.every((c) => c.state === "practiced"),
    "completed build coverage should be practiced, not just introduced"
  );
});

test("completed non-build checkpoint coverage is introduced", () => {
  const { nodes } = buildFrontierView({
    nodes: [{ ...baseNode, node_type: "lesson" }],
    currentNodeId: null,
    takenNodeIds: ["node-1"],
  });
  assert.equal(nodes[0].mode, "guide");
  assert.ok(nodes[0].coverage.length > 0, "completed guide node should produce coverage items");
  assert.ok(
    nodes[0].coverage.every((c) => c.state === "introduced"),
    "non-build coverage should stay at introduced"
  );
});

test("future nodes have no coverage items", () => {
  const { nodes } = buildFrontierView({
    nodes: [baseNode],
    currentNodeId: null,
    takenNodeIds: [],
  });
  assert.equal(nodes[0].state, "future");
  assert.equal(nodes[0].coverage.length, 0);
});

test("combineJourneyCoverage merges concepts and keeps the highest state", () => {
  const mapNodes = [
    {
      id: "a", parentId: null, title: "A", skillTag: "react", mode: "guide",
      state: "complete",
      coverage: [
        { concept: "routing", state: "introduced" },
        { concept: "state-management", state: "practiced" },
      ],
    },
    {
      id: "b", parentId: "a", title: "B", skillTag: "react", mode: "build",
      state: "complete",
      coverage: [
        { concept: "routing", state: "verified" },
        { concept: "async-await", state: "practiced" },
      ],
    },
  ];
  const combined = combineJourneyCoverage(mapNodes);
  const byConceptMap = Object.fromEntries(combined.map((c) => [c.concept, c.state]));

  assert.equal(byConceptMap["routing"], "verified", "routing was introduced then verified — verified wins");
  assert.equal(byConceptMap["state-management"], "practiced");
  assert.equal(byConceptMap["async-await"], "practiced");
});
