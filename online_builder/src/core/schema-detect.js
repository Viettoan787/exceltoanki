import { CASE_FIELDS, MCQ_FIELDS, STATUS_FIELD } from "../constants/schema.js";
import { cellToText } from "./text.js";

function withoutTechnicalColumns(headers) {
  return headers.map(cellToText).filter((header) => header && header !== STATUS_FIELD);
}

function compareFields(actual, expected) {
  return {
    missing: expected.filter((field) => !actual.includes(field)),
    extra: actual.filter((field) => !expected.includes(field)),
  };
}

export function detectSchema(headers) {
  const rawHeaders = headers.map(cellToText).filter(Boolean);
  const dataHeaders = withoutTechnicalColumns(rawHeaders);
  const candidates = [
    ["normal", MCQ_FIELDS],
    ["case", CASE_FIELDS],
  ];

  for (const [kind, fields] of candidates) {
    if (JSON.stringify(dataHeaders) === JSON.stringify(fields)) {
      return { kind, fields, missing: [], extra: [], exact: true, dataHeaders };
    }
  }

  let best = { kind: null, fields: [], missing: [], extra: [], score: -Infinity };
  for (const [kind, fields] of candidates) {
    const { missing, extra } = compareFields(dataHeaders, fields);
    const score = fields.length - missing.length - extra.length;
    if (score > best.score) {
      best = { kind, fields, missing, extra, score };
    }
  }

  return { ...best, exact: false, dataHeaders };
}

export function hasStatusColumn(headers) {
  return headers.map(cellToText).includes(STATUS_FIELD);
}
