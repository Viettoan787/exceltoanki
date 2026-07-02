import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { loadTemplateBundle } from "../src/apkg/template-loader-node.js";
import { buildApkgFromSources } from "../src/browser/pipeline.js";
import { googleSheetXlsxUrl } from "../src/input/google-sheet-url.js";
import { sourcesFromCsv, sourcesFromXlsx } from "../src/input/workbook-sources.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const fixtures = [readJson("fixtures/cp1_mini_mcq.json"), readJson("fixtures/cp1_mini_case.json")];

assert.equal(
  googleSheetXlsxUrl("https://docs.google.com/spreadsheets/d/abc123/edit#gid=0"),
  "https://docs.google.com/spreadsheets/d/abc123/export?format=xlsx",
);
assert.equal(
  googleSheetXlsxUrl("https://docs.google.com/spreadsheets/d/e/published-id/pubhtml"),
  "https://docs.google.com/spreadsheets/d/e/published-id/pub?output=xlsx",
);
assert.throws(() => googleSheetXlsxUrl("https://example.com/sheet"), /docs\.google\.com/);

{
  const [source] = sourcesFromCsv('Ques,A\n"Question, with comma","Line 1\nLine 2"', { name: "quoted.csv" });
  assert.equal(source.rows[0].values[0], "Question, with comma");
  assert.equal(source.rows[0].values[1], "Line 1\nLine 2");
}

const workbook = new ExcelJS.Workbook();
for (const fixture of fixtures) {
  const worksheet = workbook.addWorksheet(fixture.sourceName);
  worksheet.addRow(fixture.headers);
  for (const row of fixture.rows) worksheet.addRow(fixture.headers.map((header) => row[header] ?? ""));
}
workbook.addWorksheet("Sheet2").addRows([["Title", "Notes"], ["Draft", "Ignore me"]]);

const sources = await sourcesFromXlsx(await workbook.xlsx.writeBuffer(), { kind: "googleSheetTab" });
const result = await buildApkgFromSources(sources, {
  templateBundle: loadTemplateBundle(root),
  timestamp: 1700000000,
});

assert.equal(result.report.summary.sources, 2);
assert.equal(result.report.summary.ignoredSources, 1);
assert.equal(result.report.summary.normalizedRows, 2);
assert.equal(result.plan.summary.notes, 2);
assert.equal(result.plan.backend, "sqljs-jszip");

const zip = await JSZip.loadAsync(result.bytes);
assert.ok(zip.file("collection.anki2"));
assert.ok(zip.file("media"));

{
  const duplicateWorkbook = new ExcelJS.Workbook();
  for (const fixture of fixtures) {
    const worksheet = duplicateWorkbook.addWorksheet(fixture.sourceName);
    worksheet.addRow(fixture.headers);
    const duplicatedRows = fixture.rows.map((row) => ({ ...row, Source: "anki_duplicate_cross_source" }));
    for (const row of duplicatedRows) worksheet.addRow(fixture.headers.map((header) => row[header] ?? ""));
  }
  const duplicateSources = await sourcesFromXlsx(await duplicateWorkbook.xlsx.writeBuffer(), { kind: "googleSheetTab" });
  await assert.rejects(
    () => buildApkgFromSources(duplicateSources, {
      selectedSources: duplicateSources.map((source) => source.name),
      templateBundle: loadTemplateBundle(root),
      timestamp: 1700000000,
    }),
    /validation blocker/,
  );
  const selectedOnly = await buildApkgFromSources(duplicateSources, {
    selectedSources: [duplicateSources[0].name],
    templateBundle: loadTemplateBundle(root),
    timestamp: 1700000000,
  });
  assert.equal(selectedOnly.plan.summary.notes, 1);
}

console.log("CP15 browser pipeline check passed: URL, CSV/XLSX adapters, source filtering and in-memory APKG packaging.");
