const BASE91_TABLE = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q",
  "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H",
  "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y",
  "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "!", "#", "$", "%", "&", "(",
  ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "]", "^",
  "_", "`", "{", "|", "}", "~",
];

export async function guidFor(...values) {
  const hashInput = values.map(String).join("__");
  const bytes = new TextEncoder().encode(hashInput);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  let hashInt = 0n;
  for (const byte of digest.slice(0, 8)) {
    hashInt = (hashInt << 8n) + BigInt(byte);
  }

  if (hashInt === 0n) return BASE91_TABLE[0];

  const out = [];
  const base = BigInt(BASE91_TABLE.length);
  while (hashInt > 0n) {
    out.push(BASE91_TABLE[Number(hashInt % base)]);
    hashInt /= base;
  }
  return out.reverse().join("");
}
