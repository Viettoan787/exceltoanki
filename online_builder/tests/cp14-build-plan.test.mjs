import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { validateSources } from "../src/core/validate.js";
import { createApkgBuildPlan } from "../src/apkg/build-plan.js";
import { MODEL_IDS } from "../src/apkg/constants.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

const report = validateSources([
  readJson("fixtures/cp1_mini_mcq.json"),
  readJson("fixtures/cp1_mini_case.json"),
]);

if (report.summary.blockers) {
  throw new Error("Fixture report unexpectedly has blockers.");
}

const plan = await createApkgBuildPlan(report);

assert.equal(plan.status, "apkg-ready");
assert.equal(plan.backend, "sqljs-jszip");
assert.equal(plan.summary.notes, 2);
assert.equal(plan.summary.decks, 2);
assert.equal(plan.summary.models, 2);
assert.deepEqual(plan.summary.types, { normal: 1, case: 1 });
assert.deepEqual(
  plan.decks.map((deck) => deck.name).sort(),
  ["0 Nhi::Case cap cuu", "0 Nhi::Ho hap"],
);
assert.deepEqual(
  plan.models.map((model) => model.id).sort(),
  [MODEL_IDS.case, MODEL_IDS.normal].sort(),
);
assert.equal(plan.notes[0].guidSource, "anki_10000001");
assert.equal(plan.notes[1].guidSource, "anki_20000001");
assert.equal(plan.notes[0].fields.length, 12);
assert.equal(plan.notes[1].fields.length, 41);

console.log("CP14 build-plan check passed: validated rows map to deterministic deck/model/note specs.");
