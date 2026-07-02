import { IGNORED_SHEET_NAMES } from "../constants/schema.js";
import { sheetTitleToDeckPath, validateDeckPath } from "./deck-path.js";
import { detectSchema, hasStatusColumn } from "./schema-detect.js";
import { isNonEmptyRow, cellToText } from "./text.js";
import { normalizeRows } from "./normalize.js";

const GOOGLE_SHEET_KIND = "googleSheetTab";

export function validateSources(inputSources) {
  const report = {
    summary: {
      normalizedRows: 0,
      blockers: 0,
      warnings: 0,
      sources: 0,
      ignoredSources: 0,
    },
    sources: [],
    ignoredSources: [],
    issues: [],
    rows: [],
  };

  for (const rawSource of inputSources) {
    const source = normalizeSource(rawSource);
    const summary = makeSourceSummary(source);

    if (shouldIgnoreByName(source)) {
      ignore(report, summary, "ignored_sheet_name");
      continue;
    }

    const nonEmptyRows = source.rows.filter((row) => isNonEmptyRow(Object.values(row.values ? row.values : row)));
    summary.sourceRows = nonEmptyRows.length;

    if (!source.headers.length || nonEmptyRows.length === 0) {
      ignore(report, summary, "empty_source");
      continue;
    }

    const schema = detectSchema(source.headers);
    summary.kind = schema.exact ? schema.kind : schema.kind;

    if (!schema.exact) {
      if (isUnknownDraftGoogleSheet(source, schema)) {
        ignore(report, summary, "unknown_or_draft_schema");
        continue;
      }
      addSchemaIssues(report, source, schema);
      report.ignoredSources.push({ ...summary, ignored: true, ignoredReason: "schema_error" });
      continue;
    }

    const hasStatus = hasStatusColumn(source.headers);
    if (source.kind === GOOGLE_SHEET_KIND && !hasStatus) {
      report.ignoredSources.push({ ...summary, ignored: true, ignoredReason: "missing_status" });
      continue;
    }

    const deckError = validateDeckPath(source.deckPath);
    if (deckError) {
      report.issues.push({
        severity: "BLOCKER",
        code: "INVALID_DECK_PATH",
        message: deckError,
        source: source.name,
        deckPath: source.deckPath,
      });
    }

    if (!hasStatus) {
      report.issues.push({
        severity: "WARNING",
        code: "MISSING_STATUS_CONFIRMATION_REQUIRED",
        message: "Sheet chua co cot Status, du lieu co the chua duoc kiem tra. Ban chac chan muon build?",
        source: source.name,
        deckPath: source.deckPath,
      });
    }

    const rows = normalizeRows({ source, schema, hasStatus, issues: report.issues });
    summary.approvedRows = hasStatus ? rows.length : nonEmptyRows.length;
    summary.normalizedRows = rows.length;

    if (rows.length === 0) {
      ignore(report, summary, "zero_eligible_rows");
      continue;
    }

    report.sources.push(summary);
    report.rows.push(...rows);
  }

  addDuplicateCardUidIssues(report);
  finalizeSummary(report);
  return report;
}

function normalizeSource(rawSource) {
  const name = cellToText(rawSource.name || rawSource.sourceName);
  const kind = rawSource.kind || rawSource.sourceKind || "unknown";
  return {
    name,
    kind,
    deckPath: rawSource.deckPath || sheetTitleToDeckPath(name),
    headers: (rawSource.headers || []).map(cellToText),
    rows: rawSource.rows || [],
  };
}

function makeSourceSummary(source) {
  return {
    source: source.name,
    deckPath: source.deckPath,
    kind: null,
    sourceRows: 0,
    approvedRows: 0,
    normalizedRows: 0,
    ignored: false,
    ignoredReason: null,
  };
}

function shouldIgnoreByName(source) {
  return source.kind === GOOGLE_SHEET_KIND && IGNORED_SHEET_NAMES.includes(source.name);
}

function isUnknownDraftGoogleSheet(source, schema) {
  if (source.kind !== GOOGLE_SHEET_KIND) return false;
  const knownFieldCount = schema.dataHeaders.length - schema.extra.length;
  return knownFieldCount === 0;
}

function addSchemaIssues(report, source, schema) {
  for (const column of schema.missing) {
    report.issues.push({
      severity: "BLOCKER",
      code: "SCHEMA_MISSING_COLUMN",
      message: `Missing required column: ${column}`,
      source: source.name,
      deckPath: source.deckPath,
      column,
    });
  }
  for (const column of schema.extra) {
    report.issues.push({
      severity: "BLOCKER",
      code: "SCHEMA_EXTRA_COLUMN",
      message: `Unexpected column: ${column}`,
      source: source.name,
      deckPath: source.deckPath,
      column,
    });
  }
}

function ignore(report, summary, reason) {
  report.ignoredSources.push({ ...summary, ignored: true, ignoredReason: reason });
}

function addDuplicateCardUidIssues(report) {
  const byUid = new Map();
  for (const row of report.rows) {
    if (!row.cardUid) continue;
    if (!byUid.has(row.cardUid)) byUid.set(row.cardUid, []);
    byUid.get(row.cardUid).push(row);
  }

  for (const [cardUid, rows] of byUid.entries()) {
    if (rows.length <= 1) continue;
    report.issues.push({
      severity: "BLOCKER",
      code: "DUPLICATE_CARD_UID",
      message: `CardUID appears ${rows.length} times.`,
      source: rows.map((row) => `${row.source}:row${row.rowNumber}`).join(", "),
      deckPath: [...new Set(rows.map((row) => row.deckPath))].sort().join(", "),
      cardUid,
    });
  }
}

function finalizeSummary(report) {
  report.summary.normalizedRows = report.rows.length;
  report.summary.blockers = report.issues.filter((issue) => issue.severity === "BLOCKER").length;
  report.summary.warnings = report.issues.filter((issue) => issue.severity === "WARNING").length;
  report.summary.sources = report.sources.length;
  report.summary.ignoredSources = report.ignoredSources.length;
}
