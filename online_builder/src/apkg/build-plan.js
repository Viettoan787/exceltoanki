import { CASE_FIELDS, MCQ_FIELDS } from "../constants/schema.js";
import { DECK_ID_NAMESPACE, MODEL_IDS, MODEL_NAMES, TEMPLATE_FILES } from "./constants.js";
import { stableInt } from "./ids.js";

export async function createApkgBuildPlan(report, options = {}) {
  assertBuildableReport(report);
  const selectedSourceNames = new Set(options.selectedSources || []);
  const rows = report.rows.filter((row) => !selectedSourceNames.size || selectedSourceNames.has(row.source));
  if (!rows.length) {
    throw new Error("No normalized rows selected for APKG build.");
  }

  const decks = new Map();
  const models = new Map();
  const notes = [];
  const seenCardUids = new Set();

  for (const row of rows) {
    if (!["normal", "case"].includes(row.kind)) {
      throw new Error(`Unsupported row kind: ${row.kind}`);
    }
    if (!row.deckPath || !row.cardUid || !row.fields) {
      throw new Error("Every row needs deckPath, cardUid and fields before APKG build.");
    }
    if (seenCardUids.has(row.cardUid)) {
      throw new Error(`Duplicate CardUID reached APKG build plan: ${row.cardUid}`);
    }
    seenCardUids.add(row.cardUid);

    if (!decks.has(row.deckPath)) {
      decks.set(row.deckPath, {
        id: await stableInt(`${DECK_ID_NAMESPACE}::${row.deckPath}`),
        name: row.deckPath,
      });
    }
    if (!models.has(row.kind)) {
      models.set(row.kind, modelSpec(row.kind));
    }

    const fieldOrder = row.kind === "case" ? CASE_FIELDS : MCQ_FIELDS;
    notes.push({
      kind: row.kind,
      deckName: row.deckPath,
      modelId: MODEL_IDS[row.kind],
      guidSource: row.cardUid,
      fields: fieldOrder.map((field) => String(row.fields[field] || "")),
      tags: splitTags(row.fields.Tags || ""),
      source: row.source,
      rowNumber: row.rowNumber,
      cardUid: row.cardUid,
    });
  }

  return {
    version: 1,
    status: "apkg-ready",
    backend: "sqljs-jszip",
    decks: [...decks.values()].sort((a, b) => a.name.localeCompare(b.name)),
    models: [...models.values()].sort((a, b) => a.kind.localeCompare(b.kind)),
    notes,
    summary: {
      notes: notes.length,
      decks: decks.size,
      models: models.size,
      types: countBy(notes, "kind"),
    },
  };
}

function assertBuildableReport(report) {
  if (!report || typeof report !== "object") {
    throw new Error("Validation report is required.");
  }
  if ((report.summary?.blockers || 0) > 0) {
    throw new Error("Cannot build APKG while validation blockers exist.");
  }
  if (!Array.isArray(report.rows) || !report.rows.length) {
    throw new Error("Validation report has no normalized rows.");
  }
}

function modelSpec(kind) {
  const fields = kind === "case" ? CASE_FIELDS : MCQ_FIELDS;
  return {
    kind,
    id: MODEL_IDS[kind],
    name: MODEL_NAMES[kind],
    fields,
    templates: TEMPLATE_FILES[kind],
  };
}

function splitTags(value) {
  return String(value || "")
    .replace(/[,;]/g, " ")
    .split(/\s+/)
    .map((tag) => tag.replace(/[^\p{L}\p{N}_-]/gu, "_"))
    .filter(Boolean);
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    counts[item[key]] = (counts[item[key]] || 0) + 1;
  }
  return counts;
}
