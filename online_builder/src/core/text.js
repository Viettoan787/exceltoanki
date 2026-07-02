export function cellToText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function hasRealCellValue(value) {
  return cellToText(value) !== "";
}

export function isNonEmptyRow(row) {
  if (!Array.isArray(row)) return false;
  return row.some(hasRealCellValue);
}

export function normalizeStatus(value) {
  return cellToText(value);
}
