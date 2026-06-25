import test from "node:test";
import assert from "node:assert/strict";
import { computeJourneyProgress } from "./progress.ts";

test("empty journey shows zero percent and waiting label", () => {
  const result = computeJourneyProgress(0, 0);
  assert.equal(result.percent, 0);
  assert.equal(result.completed, 0);
  assert.equal(result.total, 0);
  assert.match(result.label, /waiting/i);
});

test("partial completion shows correct percentage and label", () => {
  const result = computeJourneyProgress(4, 1);
  assert.equal(result.total, 4);
  assert.equal(result.completed, 1);
  assert.equal(result.percent, 25);
  assert.match(result.label, /1 of 4/);
});

test("full completion shows 100 percent", () => {
  const result = computeJourneyProgress(3, 3);
  assert.equal(result.percent, 100);
  assert.equal(result.completed, 3);
  assert.equal(result.total, 3);
});

test("single checkpoint label uses singular form", () => {
  const result = computeJourneyProgress(1, 0);
  assert.match(result.label, /\bcheckpoint\b(?!s)/);
});

test("decision count clamps to node count and cannot exceed 100 percent", () => {
  const result = computeJourneyProgress(2, 5);
  assert.equal(result.completed, 2);
  assert.equal(result.percent, 100);
});
