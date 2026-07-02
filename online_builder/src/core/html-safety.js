import { cellToText } from "./text.js";

const ALLOWED_HTML_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "i",
  "img",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
]);

export function findSuspiciousHtml(fields) {
  const hits = [];
  for (const [field, value] of Object.entries(fields || {})) {
    const text = cellToText(value);
    const reason = suspiciousHtmlReason(text);
    if (reason) {
      hits.push({ field, value: text, reason });
    }
  }
  return hits;
}

function suspiciousHtmlReason(text) {
  if (!text) return null;

  const tagPattern = /<\s*(\/?)([A-Za-z][A-Za-z0-9:-]*)(?=[\s>/])[^>]*>/g;
  for (const match of text.matchAll(tagPattern)) {
    const tagName = match[2].toLowerCase();
    if (!ALLOWED_HTML_TAGS.has(tagName)) {
      return `Unsupported HTML tag: ${tagName}`;
    }
  }

  const danglingTagLikeText = /<\s*\/?[A-Za-z][A-Za-z0-9:-]*(?:\s[^>]*)?$/;
  if (danglingTagLikeText.test(text)) {
    return "HTML-like text appears to be missing a closing '>'";
  }

  return null;
}
