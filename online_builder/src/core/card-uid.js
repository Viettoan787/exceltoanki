import { CARD_UID_PATTERN } from "../constants/schema.js";
import { cellToText } from "./text.js";

const CARD_UID_RE = new RegExp(CARD_UID_PATTERN);

export function extractCardUid(sourceValue) {
  const match = CARD_UID_RE.exec(cellToText(sourceValue));
  return match ? match[0] : null;
}
