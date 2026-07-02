import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { CASE_FIELDS, MCQ_FIELDS, STATUS_FIELD } from "../src/constants/schema.js";
import { extractCardUid } from "../src/core/card-uid.js";
import { sheetTitleToDeckPath } from "../src/core/deck-path.js";
import { detectSchema } from "../src/core/schema-detect.js";
import { validateSources } from "../src/core/validate.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function issueCodes(report) {
  return new Set(report.issues.map((issue) => issue.code));
}

const mcqFixture = readJson("fixtures/cp1_mini_mcq.json");
const caseFixture = readJson("fixtures/cp1_mini_case.json");

assert.equal(sheetTitleToDeckPath("0 Nhi > Ho hap"), "0 Nhi::Ho hap");
assert.equal(sheetTitleToDeckPath("0 Nhi>Ho hap"), "0 Nhi>Ho hap");
assert.equal(extractCardUid("source anki_10000001 row"), "anki_10000001");

assert.deepEqual(detectSchema([STATUS_FIELD, ...MCQ_FIELDS]).missing, []);
assert.equal(detectSchema([STATUS_FIELD, ...MCQ_FIELDS]).kind, "normal");
assert.equal(detectSchema([STATUS_FIELD, ...CASE_FIELDS]).kind, "case");

{
  const report = validateSources([mcqFixture, caseFixture]);
  assert.equal(report.summary.blockers, 0);
  assert.equal(report.summary.sources, 2);
  assert.equal(report.summary.ignoredSources, 0);
  assert.equal(report.summary.normalizedRows, 2);
  assert.deepEqual(report.sources.map((source) => source.deckPath), [
    "0 Nhi::Ho hap",
    "0 Nhi::Case cap cuu",
  ]);
  assert.deepEqual(report.rows.map((row) => row.cardUid), ["anki_10000001", "anki_20000001"]);
  assert.equal(issueCodes(report).has("HTML_CONTENT_SAFETY"), false);
}

{
  const report = validateSources([
    {
      name: "Sheet2",
      kind: "googleSheetTab",
      headers: ["Title", "Notes"],
      rows: [{ Title: "Draft", Notes: "not an Anki table" }],
    },
  ]);
  assert.equal(report.summary.sources, 0);
  assert.equal(report.summary.ignoredSources, 1);
  assert.equal(report.ignoredSources[0].ignoredReason, "unknown_or_draft_schema");
  assert.equal(report.summary.blockers, 0);
}

{
  const legacyExport = structuredClone(mcqFixture);
  legacyExport.sourceName = "Anki Export";
  legacyExport.headers = MCQ_FIELDS;
  legacyExport.rows = legacyExport.rows.map(({ Status, ...row }) => row);
  const report = validateSources([legacyExport]);
  assert.equal(report.summary.sources, 0);
  assert.equal(report.summary.ignoredSources, 1);
  assert.equal(report.ignoredSources[0].ignoredReason, "ignored_sheet_name");
  assert.equal(report.summary.blockers, 0);
  assert.equal(issueCodes(report).has("GOOGLE_SHEET_TAB_MISSING_STATUS"), false);
}

{
  const report = validateSources([
    {
      name: "0 Nhi > Missing Status",
      kind: "googleSheetTab",
      headers: MCQ_FIELDS,
      rows: [
        {
          Ques: "Missing status?",
          A: "A",
          B: "B",
          C: "C",
          D: "D",
          E: "E",
          Ans: "A",
          Ex: "",
          Source: "anki_30000001",
          Note: "",
          Image: "",
          Tags: "",
        },
      ],
    },
  ]);
  assert.equal(report.summary.sources, 0);
  assert.equal(report.summary.ignoredSources, 1);
  assert.equal(report.ignoredSources[0].ignoredReason, "missing_status");
  assert.equal(issueCodes(report).has("GOOGLE_SHEET_TAB_MISSING_STATUS"), false);
  assert.equal(report.summary.blockers, 0);
}

{
  const partialHeaders = [STATUS_FIELD, ...MCQ_FIELDS.filter((field) => field !== "Ans")];
  const report = validateSources([
    {
      name: "0 Nhi > Partial",
      kind: "googleSheetTab",
      headers: partialHeaders,
      rows: [{ Status: "Approved", Ques: "Partial table", A: "A" }],
    },
  ]);
  assert.equal(report.summary.sources, 0);
  assert.equal(report.summary.ignoredSources, 1);
  assert.ok(issueCodes(report).has("SCHEMA_MISSING_COLUMN"));
  assert.equal(report.summary.blockers, 1);
}

{
  const htmlFixture = structuredClone(mcqFixture);
  htmlFixture.rows[0].Ex = "pH < 7.35 and INR > 1.5; H<sub>2</sub>O is allowed.";
  const report = validateSources([htmlFixture]);
  assert.equal(issueCodes(report).has("HTML_CONTENT_SAFETY"), false);
  assert.equal(report.summary.warnings, 0);
}

{
  const htmlFixture = structuredClone(mcqFixture);
  htmlFixture.rows[0].Ex = "Do not allow <script>alert(1)</script> here.";
  const report = validateSources([htmlFixture]);
  assert.ok(issueCodes(report).has("HTML_CONTENT_SAFETY"));
  assert.equal(report.summary.blockers, 0);
}

{
  const report = validateSources([
    {
      name: "local_fixture.csv",
      kind: "csvFile",
      headers: MCQ_FIELDS,
      rows: [
        {
          Ques: "CSV without Status?",
          A: "A",
          B: "B",
          C: "C",
          D: "D",
          E: "E",
          Ans: "A",
          Ex: "",
          Source: "anki_40000001",
          Note: "",
          Image: "",
          Tags: "",
        },
      ],
    },
  ]);
  assert.equal(report.summary.sources, 1);
  assert.ok(issueCodes(report).has("MISSING_STATUS_CONFIRMATION_REQUIRED"));
  assert.equal(report.summary.blockers, 0);
}

{
  const duplicateA = structuredClone(mcqFixture);
  const duplicateB = structuredClone(mcqFixture);
  duplicateB.sourceName = "0 Noi > Duplicate";
  duplicateB.rows[0].Source = "anki_10000001; duplicated";
  const report = validateSources([duplicateA, duplicateB]);
  assert.ok(issueCodes(report).has("DUPLICATE_CARD_UID"));
  assert.equal(report.summary.blockers, 1);
}

console.log("CP13 validation tests passed: schema, Status filtering, ignored sources, blockers, warnings, deck paths, CardUIDs.");
