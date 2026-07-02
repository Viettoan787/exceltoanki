import { APPROVED_STATUS, CASE_FIELDS, MCQ_FIELDS, STATUS_FIELD } from "../constants/schema.js";
import { extractCardUid } from "./card-uid.js";
import { findSuspiciousHtml } from "./html-safety.js";
import { cellToText, isNonEmptyRow, normalizeStatus } from "./text.js";

export function rowObjectFromArray(headers, values) {
  const row = {};
  headers.forEach((header, index) => {
    row[cellToText(header)] = cellToText(values[index]);
  });
  return row;
}

export function normalizeRows({ source, schema, hasStatus, issues }) {
  const fields = schema.kind === "case" ? CASE_FIELDS : MCQ_FIELDS;
  const answerFields = schema.kind === "case" ? ["Ans1", "Ans2", "Ans3", "Ans4", "Ans5"] : ["Ans"];
  const allowedAnswers = schema.kind === "case" ? new Set(["A", "B", "C", "D"]) : new Set(["A", "B", "C", "D", "E"]);
  const rows = [];

  source.rows.forEach((rawRow, index) => {
    const rowNumber = Number.isInteger(rawRow.rowNumber) ? rawRow.rowNumber : index + 2;
    const row = rawRow.values ? rowObjectFromArray(source.headers, rawRow.values) : rawRow;
    if (!isNonEmptyRow(Object.values(row))) return;

    if (hasStatus && normalizeStatus(row[STATUS_FIELD]) !== APPROVED_STATUS) return;

    const normalizedFields = Object.fromEntries(fields.map((field) => [field, cellToText(row[field])]));
    const cardUid = extractCardUid(normalizedFields.Source);
    let rowHasBlocker = false;

    for (const answerField of answerFields) {
      const answer = cellToText(normalizedFields[answerField]).toUpperCase();
      const questionField = answerField === "Ans" ? "Ques" : `Ques${answerField.slice(3)}`;
      if (!cellToText(normalizedFields[questionField]) && !answer) continue;
      if (!allowedAnswers.has(answer)) {
        issues.push({
          severity: "BLOCKER",
          code: answer.length > 1 ? "MULTIPLE_ANSWERS" : "INVALID_ANSWER",
          message: `${answerField} must be exactly one allowed answer.`,
          source: source.name,
          deckPath: source.deckPath,
          row: rowNumber,
          column: answerField,
          cardUid,
        });
        rowHasBlocker = true;
      }
    }

    for (const hit of findSuspiciousHtml(normalizedFields)) {
      issues.push({
        severity: "WARNING",
        code: "HTML_CONTENT_SAFETY",
        message: `Potential unsafe or malformed HTML in ${hit.field}. ${hit.reason}`,
        source: source.name,
        deckPath: source.deckPath,
        row: rowNumber,
        column: hit.field,
        cardUid,
      });
    }

    if (!cardUid) {
      issues.push({
        severity: "WARNING",
        code: "MISSING_CARD_UID",
        message: "Source does not contain a stable CardUID.",
        source: source.name,
        deckPath: source.deckPath,
        row: rowNumber,
      });
    }

    if (!rowHasBlocker) {
      rows.push({
        source: source.name,
        deckPath: source.deckPath,
        rowNumber,
        kind: schema.kind,
        cardUid,
        fields: normalizedFields,
      });
    }
  });

  return rows;
}
