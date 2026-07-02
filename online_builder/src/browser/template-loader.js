const TEMPLATE_PATHS = {
  normal: ["mcq-front.html", "mcq-back.html", "mcq-style.css"],
  case: ["case-front.html", "case-back.html", "case-style.css"],
};

export async function loadBrowserTemplateBundle(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");
  const baseUrl = new URL(options.baseUrl || "../templates/", import.meta.url);
  const renderer = await fetchText(new URL("auto-image-link-renderer.js", baseUrl), fetchImpl);
  const math = await fetchText(new URL("math-chem-renderer.js", baseUrl), fetchImpl);
  const bundle = {};

  for (const [kind, [front, back, style]] of Object.entries(TEMPLATE_PATHS)) {
    bundle[kind] = {
      front: inject(await fetchText(new URL(front, baseUrl), fetchImpl), renderer, math),
      back: inject(await fetchText(new URL(back, baseUrl), fetchImpl), renderer, math),
      style: await fetchText(new URL(style, baseUrl), fetchImpl),
    };
  }
  return bundle;
}

async function fetchText(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Template download failed with HTTP ${response.status}: ${url}`);
  return response.text();
}

function inject(template, renderer, math) {
  return template
    .replaceAll("{{AnkiAutoImageLinkRenderer}}", renderer)
    .replaceAll("{{MathChemRenderer}}", math);
}

