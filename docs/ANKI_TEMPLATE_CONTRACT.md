# Anki template structure contract

This contract keeps Anki cards compatible with the future exam builder.

## MCQ fields

`Ques, A, B, C, D, E, Ans, Ex, Source, Note, Image, Tags`

Stable structural markers:

- Main card: `#myCard`
- Front/back: `.front`, `.back`
- Options form: `#shuffle`
- Option rows: `.container`, `.option`, `.checkbox`
- Option identity: `#A` through `#E`
- Explanation and note: `#extra`, `#note`
- Display controls: `.card-toolbar`, `.font-control-panel`, `#theme-btn`

## MCQ Case fields

`CaseTitle, CaseStem, Ques1, A1, B1, C1, D1, Ans1, Ex1, ... Ques5, A5, B5, C5, D5, Ans5, Ex5, Source, Note, Image, Tags`

Stable structural markers:

- Main card: `#myCard`
- Case form: `#case-form`
- Question block: `.case-question[data-q]`
- Option row: `.case-option[data-q][data-letter]`
- Back review: `#case-review`, `.review-question[data-q][data-ans]`
- Result: `#case-result`
- Display controls: `.card-toolbar`, `.font-control-panel`, `#theme-btn`

## Compatibility rules

- Do not rename, remove, or repurpose fields and structural markers without a schema migration.
- HTML chemistry uses `<sub>`, `<sup>` and HTML entities such as `&#8652;`.
- Formula rendering may change, but it must not change the field schema or structural markers.
- Answer shuffling remains disabled by default and is not considered verified yet.
- New template checkpoints use new model IDs and a new smoke-test deck.
- After a replacement APKG is verified, remove older generated APKG checkpoints from `output/apkg`.
- Preserve extracted originals in `Anki_template/original_reference/`.
