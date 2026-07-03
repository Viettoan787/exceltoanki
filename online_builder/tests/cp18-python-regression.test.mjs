import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import initSqlJs from "sql.js";
import JSZip from "jszip";
import { loadTemplateBundle } from "../src/apkg/template-loader-node.js";
import { guidFor } from "../src/apkg/guid.js";
import { createApkgBuildPlan } from "../src/apkg/build-plan.js";
import { DECK_ID_NAMESPACE, MODEL_IDS, MODEL_NAMES } from "../src/apkg/constants.js";
import { stableInt } from "../src/apkg/ids.js";
import { packageApkgFromPlan } from "../src/apkg/package-sqljs.js";
import { CASE_FIELDS, MCQ_FIELDS } from "../src/constants/schema.js";
import { validateSources } from "../src/core/validate.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));

const PYTHON_BASELINE = Object.freeze({
  notes: 2,
  cards: 2,
  decks: Object.freeze(["0 Nhi::Case cap cuu", "0 Nhi::Ho hap"]),
  deckIds: Object.freeze({
    "0 Nhi::Case cap cuu": 199647152321,
    "0 Nhi::Ho hap": 400090667127,
  }),
  modelFields: Object.freeze({
    [MODEL_IDS.case]: CASE_FIELDS,
    [MODEL_IDS.normal]: MCQ_FIELDS,
  }),
  modelNames: Object.freeze({
    [MODEL_IDS.case]: MODEL_NAMES.case,
    [MODEL_IDS.normal]: MODEL_NAMES.normal,
  }),
  cardGuids: Object.freeze({
    anki_10000001: "Ixu]v?.8!<",
    anki_20000001: "q9={5`C;};",
  }),
});

const fixtures = [readJson("fixtures/cp1_mini_mcq.json"), readJson("fixtures/cp1_mini_case.json")];
const report = validateSources(fixtures);
assert.equal(report.summary.blockers, 0);
assert.equal(report.summary.normalizedRows, PYTHON_BASELINE.notes);

const plan = await createApkgBuildPlan(report);
assert.equal(plan.summary.notes, PYTHON_BASELINE.notes);
assert.deepEqual(
  plan.decks.map((deck) => deck.name),
  PYTHON_BASELINE.decks,
);

for (const deckName of PYTHON_BASELINE.decks) {
  assert.equal(await stableInt(`${DECK_ID_NAMESPACE}::${deckName}`), PYTHON_BASELINE.deckIds[deckName]);
  assert.equal(plan.decks.find((deck) => deck.name === deckName)?.id, PYTHON_BASELINE.deckIds[deckName]);
}

for (const model of plan.models) {
  assert.deepEqual(model.fields, PYTHON_BASELINE.modelFields[model.id]);
  assert.equal(model.name, PYTHON_BASELINE.modelNames[model.id]);
}

for (const [cardUid, pythonGuid] of Object.entries(PYTHON_BASELINE.cardGuids)) {
  assert.equal(await guidFor(cardUid), pythonGuid);
}

const inspected = await inspectJsApkg(plan);
assert.equal(inspected.integrity, "ok");
assert.equal(inspected.notes, PYTHON_BASELINE.notes);
assert.equal(inspected.cards, PYTHON_BASELINE.cards);
assert.deepEqual(inspected.deckNames, PYTHON_BASELINE.decks);
assert.deepEqual(inspected.modelFields, PYTHON_BASELINE.modelFields);
assert.deepEqual(inspected.noteGuids, Object.values(PYTHON_BASELINE.cardGuids).sort());

const editedFixtures = clone(fixtures);
editedFixtures[0].rows[0].Ques = "Edited question text with unchanged CardUID";
const editedReport = validateSources(editedFixtures);
const editedPlan = await createApkgBuildPlan(editedReport);
const editedInspected = await inspectJsApkg(editedPlan);
assert.deepEqual(editedInspected.noteGuids, inspected.noteGuids);

async function inspectJsApkg(buildPlan) {
  const bytes = await packageApkgFromPlan(buildPlan, loadTemplateBundle(root), { timestamp: 1700000000 });
  const zip = await JSZip.loadAsync(bytes);
  assert.ok(zip.file("collection.anki2"));
  assert.ok(zip.file("media"));

  const collectionBytes = await zip.file("collection.anki2").async("uint8array");
  const SQL = await initSqlJs();
  const db = new SQL.Database(collectionBytes);
  try {
    const integrity = db.exec("PRAGMA integrity_check")[0].values[0][0];
    const notes = db.exec("SELECT COUNT(*) FROM notes")[0].values[0][0];
    const cards = db.exec("SELECT COUNT(*) FROM cards")[0].values[0][0];
    const col = db.exec("SELECT decks, models FROM col")[0].values[0];
    const noteGuids = db.exec("SELECT guid FROM notes ORDER BY guid")[0].values.flat();
    const decks = JSON.parse(col[0]);
    const models = JSON.parse(col[1]);

    return {
      integrity,
      notes,
      cards,
      deckNames: Object.values(decks)
        .map((deck) => deck.name)
        .filter((name) => name !== "Default")
        .sort(),
      modelFields: Object.fromEntries(
        Object.entries(models).map(([modelId, model]) => [
          modelId,
          model.flds.map((field) => field.name),
        ]),
      ),
      noteGuids,
    };
  } finally {
    db.close();
  }
}

console.log("CP18 Python regression check passed: JS APKG matches Python deck/model/CardUID invariants.");
