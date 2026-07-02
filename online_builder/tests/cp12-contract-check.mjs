import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  APPROVED_STATUS,
  CARD_UID_PATTERN,
  CASE_FIELDS,
  MCQ_FIELDS,
  STATUS_FIELD,
} from "../src/constants/schema.js";
import {
  ONLINE_BUILDER_CHECKPOINT,
  ONLINE_BUILDER_VERSION,
} from "../src/constants/versions.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const expectedMcq = [
  "Ques",
  "A",
  "B",
  "C",
  "D",
  "E",
  "Ans",
  "Ex",
  "Source",
  "Note",
  "Image",
  "Tags",
];

const expectedCase = [
  "CaseTitle",
  "CaseStem",
  "Ques1",
  "A1",
  "B1",
  "C1",
  "D1",
  "Ans1",
  "Ex1",
  "Ques2",
  "A2",
  "B2",
  "C2",
  "D2",
  "Ans2",
  "Ex2",
  "Ques3",
  "A3",
  "B3",
  "C3",
  "D3",
  "Ans3",
  "Ex3",
  "Ques4",
  "A4",
  "B4",
  "C4",
  "D4",
  "Ans4",
  "Ex4",
  "Ques5",
  "A5",
  "B5",
  "C5",
  "D5",
  "Ans5",
  "Ex5",
  "Source",
  "Note",
  "Image",
  "Tags",
];

function assertDeepEqual(name, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${name} does not match the frozen contract`);
  }
}

function assertFile(path) {
  if (!existsSync(join(root, path))) {
    throw new Error(`Missing required CP12 file: ${path}`);
  }
}

assertDeepEqual("MCQ_FIELDS", MCQ_FIELDS, expectedMcq);
assertDeepEqual("CASE_FIELDS", CASE_FIELDS, expectedCase);

const frozenContract = JSON.parse(readFileSync(join(workspaceRoot, "docs/schema_contract.v1.json"), "utf8"));
assertDeepEqual("MCQ_FIELDS vs docs/schema_contract.v1.json", MCQ_FIELDS, frozenContract.schemas.normal.fields);
assertDeepEqual("CASE_FIELDS vs docs/schema_contract.v1.json", CASE_FIELDS, frozenContract.schemas.case.fields);

const versionParts = ONLINE_BUILDER_VERSION.split(".").map(Number);
if (versionParts.length !== 3 || versionParts.some(Number.isNaN) || versionParts[0] < 2) {
  throw new Error("Online builder version must remain on or after the v2 contract line");
}
if (!/^CP\d+$/.test(ONLINE_BUILDER_CHECKPOINT)) {
  throw new Error("Online builder checkpoint metadata is invalid");
}

if (STATUS_FIELD !== "Status" || APPROVED_STATUS !== "Approved") {
  throw new Error("Status contract changed unexpectedly");
}

if (!new RegExp(CARD_UID_PATTERN).test("anki_10000001")) {
  throw new Error("CardUID pattern does not match current fixture IDs");
}

[
  "src/templates/mcq-front.html",
  "src/templates/mcq-back.html",
  "src/templates/mcq-style.css",
  "src/templates/case-front.html",
  "src/templates/case-back.html",
  "src/templates/case-style.css",
  "src/templates/auto-image-link-renderer.js",
  "src/templates/math-chem-renderer.js",
  "fixtures/cp1_mini_mcq.json",
  "fixtures/cp1_mini_case.json",
  "fixtures/cp1_mixed_sources.json",
  "fixtures/expected_reports/cp12_source_filtering_decisions.json",
  "SOURCE_FILTERING_DECISION_TABLE.md",
].forEach(assertFile);

const mcqFixture = JSON.parse(readFileSync(join(root, "fixtures/cp1_mini_mcq.json"), "utf8"));
const caseFixture = JSON.parse(readFileSync(join(root, "fixtures/cp1_mini_case.json"), "utf8"));

assertDeepEqual("MCQ fixture headers", mcqFixture.headers.slice(1), expectedMcq);
assertDeepEqual("Case fixture headers", caseFixture.headers.slice(1), expectedCase);

console.log("Contract check passed: schema, templates, fixtures, and filtering table are present.");
