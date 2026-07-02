import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadTemplateBundle(rootDir) {
  const renderer = read(join(rootDir, "src/templates/auto-image-link-renderer.js"));
  const math = read(join(rootDir, "src/templates/math-chem-renderer.js"));
  return {
    normal: {
      front: inject(read(join(rootDir, "src/templates/mcq-front.html")), renderer, math),
      back: inject(read(join(rootDir, "src/templates/mcq-back.html")), renderer, math),
      style: read(join(rootDir, "src/templates/mcq-style.css")),
    },
    case: {
      front: inject(read(join(rootDir, "src/templates/case-front.html")), renderer, math),
      back: inject(read(join(rootDir, "src/templates/case-back.html")), renderer, math),
      style: read(join(rootDir, "src/templates/case-style.css")),
    },
  };
}

function read(path) {
  return readFileSync(path, "utf8");
}

function inject(template, renderer, math) {
  return template
    .replaceAll("{{AnkiAutoImageLinkRenderer}}", renderer)
    .replaceAll("{{MathChemRenderer}}", math);
}
