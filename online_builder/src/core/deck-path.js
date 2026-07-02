import { cellToText } from "./text.js";

const SHEET_DECK_SEPARATOR_RE = /\s+>\s+/g;

export function sheetTitleToDeckPath(sheetTitle) {
  return cellToText(sheetTitle).replace(SHEET_DECK_SEPARATOR_RE, "::");
}

export function validateDeckPath(deckPath) {
  const text = cellToText(deckPath);
  if (!text) return "Deck path is empty.";
  if (text.startsWith("::") || text.endsWith("::")) {
    return "Deck path cannot start or end with '::'.";
  }
  if (text.split("::").some((segment) => !segment.trim())) {
    return "Deck path contains an empty segment.";
  }
  return null;
}
