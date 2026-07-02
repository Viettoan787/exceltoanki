import normalFront from "../templates/mcq-front.html?raw";
import normalBack from "../templates/mcq-back.html?raw";
import normalStyle from "../templates/mcq-style.css?raw";
import caseFront from "../templates/case-front.html?raw";
import caseBack from "../templates/case-back.html?raw";
import caseStyle from "../templates/case-style.css?raw";
import renderer from "../templates/auto-image-link-renderer.js?raw";
import math from "../templates/math-chem-renderer.js?raw";

export const BROWSER_TEMPLATE_BUNDLE = Object.freeze({
  normal: {
    front: inject(normalFront),
    back: inject(normalBack),
    style: normalStyle,
  },
  case: {
    front: inject(caseFront),
    back: inject(caseBack),
    style: caseStyle,
  },
});

function inject(template) {
  return template
    .replaceAll("{{AnkiAutoImageLinkRenderer}}", renderer)
    .replaceAll("{{MathChemRenderer}}", math);
}

