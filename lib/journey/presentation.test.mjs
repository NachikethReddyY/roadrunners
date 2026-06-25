import test from "node:test";
import assert from "node:assert/strict";
import {
  canUserConfirmCompletion,
  checkpointModeForNode,
  highestCoverageState,
  presentFeatureChoices,
  projectContributionForChoice,
} from "./presentation.ts";

const context = {
  roadmapGoal: "Build a community events app",
  currentSkillTag: "react",
};

test("presents one, two, and at most three coherent choices", () => {
  const rows = Array.from({ length: 4 }, (_, index) => ({
    id: String(index + 1),
    label: `Feature ${index + 1}`,
    description: `Deliver feature ${index + 1}`,
    target_skill_tag: "react",
  }));

  assert.equal(presentFeatureChoices(rows.slice(0, 1), context).length, 1);
  assert.equal(presentFeatureChoices(rows.slice(0, 2), context).length, 2);
  assert.equal(presentFeatureChoices(rows, context).length, 3);
});

test("preserves locked and deferred availability without inventing unlocks", () => {
  const choices = presentFeatureChoices(
    [
      {
        id: "locked",
        label: "Protected admin route",
        target_skill_tag: "auth",
        availability: "locked",
        prerequisites: ["Session handling"],
      },
      {
        id: "deferred",
        label: "Offline event cache",
        target_skill_tag: "caching",
        availability: "deferred",
      },
    ],
    context
  );

  assert.equal(choices[0].availability, "locked");
  assert.deepEqual(choices[0].prerequisites, ["Session handling"]);
  assert.equal(choices[1].availability, "deferred");
});

test("every branch and pivot has an explicit project contribution", () => {
  const contribution = projectContributionForChoice({
    title: "Mobile event check-in",
    targetSkillTag: "swift",
    roadmapGoal: context.roadmapGoal,
    isPivot: true,
  });

  assert.match(contribution, /current project/i);
  assert.match(contribution, /Mobile event check-in/);
});

test("maps legacy node types to product checkpoint modes", () => {
  assert.equal(checkpointModeForNode("lesson"), "guide");
  assert.equal(checkpointModeForNode("choice"), "choice");
  assert.equal(checkpointModeForNode("milestone"), "milestone");
  assert.equal(checkpointModeForNode("lesson", true), "build");
});

test("completion confirmation requires running code and available infrastructure", () => {
  const base = {
    runs: true,
    fulfills: false,
    reason: "Visual requirement needs confirmation",
    objectiveFulfillment: "inconclusive",
  };

  assert.equal(canUserConfirmCompletion(base), true);
  assert.equal(canUserConfirmCompletion({ ...base, runs: false }), false);
  assert.equal(
    canUserConfirmCompletion({
      ...base,
      fulfills: true,
      objectiveFulfillment: "pass",
    }),
    false
  );
  assert.equal(
    canUserConfirmCompletion({ ...base, infrastructureError: true }),
    false
  );
});

test("coverage only moves upward from introduced to practiced to verified", () => {
  assert.equal(highestCoverageState("verified", "introduced"), "verified");
  assert.equal(highestCoverageState("introduced", "practiced"), "practiced");
  assert.equal(highestCoverageState("practiced", "verified"), "verified");
});
