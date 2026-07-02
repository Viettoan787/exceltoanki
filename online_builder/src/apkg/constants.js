export const MODEL_IDS = Object.freeze({
  case: 1707015001,
  normal: 1707015002,
});

export const MODEL_NAMES = Object.freeze({
  case: "PDF Anki MCQ Case V10 OriginalStructure HTMLChem",
  normal: "PDF Anki MCQ NonCase V10 OriginalStructure HTMLChem",
});

export const DECK_ID_NAMESPACE = "pdf_anki_deck_v1";

export const TEMPLATE_FILES = Object.freeze({
  case: Object.freeze({
    front: "src/templates/case-front.html",
    back: "src/templates/case-back.html",
    style: "src/templates/case-style.css",
  }),
  normal: Object.freeze({
    front: "src/templates/mcq-front.html",
    back: "src/templates/mcq-back.html",
    style: "src/templates/mcq-style.css",
  }),
});
