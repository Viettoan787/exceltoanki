export async function sha1Hex(text) {
  const bytes = new TextEncoder().encode(String(text));
  const digest = await globalThis.crypto.subtle.digest("SHA-1", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function stableInt(text, digits = 10) {
  const hex = await sha1Hex(text);
  return Number.parseInt(hex.slice(0, digits), 16);
}
