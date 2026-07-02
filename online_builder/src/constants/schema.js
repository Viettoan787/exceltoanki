export const STATUS_FIELD = "Status";
export const APPROVED_STATUS = "Approved";
export const TECHNICAL_COLUMNS = Object.freeze([STATUS_FIELD]);
export const IGNORED_SHEET_NAMES = Object.freeze([
  "README",
  "CONFIG",
  "Anki Export",
  "Anki Export Case",
]);
export const CARD_UID_PATTERN = "\\b(?:anki|nhi)_[A-Za-z0-9_]+\\b";

export const MCQ_FIELDS = Object.freeze([
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
]);

export const CASE_FIELDS = Object.freeze([
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
]);

export const SCHEMAS = Object.freeze({
  normal: Object.freeze({
    label: "MCQ",
    fields: MCQ_FIELDS,
    answerField: "Ans",
    answerChoices: Object.freeze(["A", "B", "C", "D", "E"]),
  }),
  case: Object.freeze({
    label: "MCQ Case",
    fields: CASE_FIELDS,
    answerFields: Object.freeze(["Ans1", "Ans2", "Ans3", "Ans4", "Ans5"]),
    answerChoices: Object.freeze(["A", "B", "C", "D"]),
  }),
});

export const SCHEMA_CONTRACT = Object.freeze({
  version: 1,
  statusColumn: STATUS_FIELD,
  approvedStatus: APPROVED_STATUS,
  technicalColumns: TECHNICAL_COLUMNS,
  ignoredSheetNames: IGNORED_SHEET_NAMES,
  cardUid: Object.freeze({
    field: "Source",
    pattern: CARD_UID_PATTERN,
  }),
  schemas: SCHEMAS,
});
