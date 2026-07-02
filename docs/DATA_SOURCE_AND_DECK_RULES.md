# Data Source and Deck Rules

This file is the authoritative contract for importing CSV/Spreadsheet data and
mapping it to Anki. Later sessions must follow these rules unless the user
explicitly approves a contract change.

## 1. Status is review metadata only

- `Status` exists only to review and approve source rows.
- `Status` must never become an Anki field, tag, Source value, rendered card
  content, APKG payload field or exam-builder field.
- The rule is based on the data columns, not where the data came from.
- If CSV or Spreadsheet data contains `Status`, include only rows whose normalized
  value is exactly `Approved`, then remove the entire `Status` column.
- If the input does not contain `Status`, process every non-empty data row, but
  raise a visible non-blocking warning before build:
  `Sheet chua co cot Status, du lieu co the chua duoc kiem tra. Ban chac chan muon build?`
- A CSV may be uploaded directly or imported back into a Spreadsheet; the same
  rule applies in both cases.

Canonical flow:

```text
CSV or Spreadsheet
        |
        v
If Status exists: keep Approved rows only
        |
        v
If Status is absent: warn before using all non-empty rows
        |
        v
Remove Status completely
        |
        v
Detect MCQ or Case from the remaining schema
        |
        v
Validate and build APKG
```

## 2. Card type is detected from structure

- Do not infer MCQ/Case from the sheet name or filename.
- Ignore/remove technical columns such as `Status` before schema detection.
- MCQ schema:

```text
Ques, A, B, C, D, E, Ans, Ex, Source, Note, Image, Tags
```

- MCQ Case schema:

```text
CaseTitle, CaseStem,
Ques1, A1, B1, C1, D1, Ans1, Ex1,
Ques2, A2, B2, C2, D2, Ans2, Ex2,
Ques3, A3, B3, C3, D3, Ans3, Ex3,
Ques4, A4, B4, C4, D4, Ans4, Ex4,
Ques5, A5, B5, C5, D5, Ans5, Ex5,
Source, Note, Image, Tags
```

- Headerless final exports may be detected by exact canonical column count:
  12 columns for MCQ and 41 columns for Case.
- A malformed or ambiguous schema must block export. Never guess silently.
- One Spreadsheet may contain both types, or separate Spreadsheets may be used
  for MCQ and Case. Every sheet is still verified independently.

## 3. Sheet/tab name maps to the Anki deck path

- For Google Sheet and XLSX sources, the complete sheet/tab name is the editable
  deck label shown to the user.
- Anki subdeck levels use `::`, but Microsoft Excel forbids `:` in worksheet
  names. Therefore sheet/tab titles use spaced greater-than separators:
  `0 Nhi > Ho hap` maps to Anki deck `0 Nhi::Ho hap`.
- Only the exact separator pattern with surrounding spaces is translated:
  ` > ` becomes `::`.
- Do not translate `-`, `_`, `/` or bare `>` without surrounding spaces.
- CSV sources do not have sheet titles, so they keep the explicit deck path typed
  in the UI or CLI; CSV deck paths may use `::` directly.

Examples:

```text
0 Nhi > Ho hap        -> 0 Nhi::Ho hap
0 Nhi > Tieu hoa      -> 0 Nhi::Tieu hoa
0 Ngoai > Chan thuong -> 0 Ngoai::Chan thuong
0 Noi > Tim mach > MCQ tong hop -> 0 Noi::Tim mach::MCQ tong hop
```

- The sheet name does not need to contain `MCQ` or `Case`.
- Do not add, remove or rewrite a deck segment beyond the explicit ` > ` mapping.
- Empty segments, leading/trailing `::` and duplicate normalized deck paths are
  validation errors.
- System tabs such as `CONFIG` and `README` may be explicitly ignored, but a
  data-looking tab with an invalid schema must be reported rather than hidden.
- `Anki Export` and `Anki Export Case` are legacy Apps Script/CSV compatibility
  outputs. They are ignored by default in the direct APKG workflow so the app
  does not accidentally build generic decks named after export tabs.

## 4. Answer policy

- MCQ has exactly one correct answer: one letter from `A` through `E`.
- Case subquestions have exactly one correct answer: one letter from `A` through
  `D`.
- Multi-answer values such as `AC` or `BD` are unsupported and must block export.

## 5. Formula policy

- V10 HTMLChem is the accepted renderer.
- MathJax and mhchem are not required.
- Use HTML `<sub>` and `<sup>` for subscripts and superscripts.
- The display pipeline must preserve or safely normalize common arrows:
  `->` to `→`, `=>` to `⇒`, `<->` to `↔`, and reversible reaction `⇌`.
- Formula normalization must not modify URLs, HTML tags or ordinary comparison
  text accidentally.

## 6. Card identity inside Source

- Do not add new Anki fields solely for identity, to preserve compatibility with
  the existing exam-builder schema.
- Each source row receives a stable CardUID generated once and never changed when
  question text, answer, explanation, sheet name or deck path is edited.
- Store the human medical source, clickable Sheet link and visible CardUID inside
  the existing `Source` field.

Canonical Source HTML:

```html
[medical source]<br>
<a href="[sheet link]">Mo Sheet - [CardUID]</a>
```

- The APKG builder uses CardUID embedded in Source as the stable note identity.
- The row/range part of a Sheet link is a convenience locator, not identity.
- If sorting makes the range stale, searching CardUID in the Sheet must locate
  the source row.
- During pre-CP8 testing, rows without a CardUID may build with a generated
  `auto_...` fallback identity, but this must be shown as a warning. Production
  update-safe use still requires a stable CardUID in `Source`.

## 7. Duplicate and update safety

- Duplicate CardUID in one build is a blocking error with all source locations.
- Identical content with different CardUID values is a warning, not an automatic
  deletion.
- One CardUID cannot target two different deck paths in the same build.
- Rebuilding or editing content with the same CardUID must update the same Anki
  note; this behavior must pass the update checkpoint before release.
- Deleting a source row must not automatically delete the Anki note in the first
  release.

## 8. APKG selection behavior

- The UI may select one, multiple or all valid sheets/files.
- Before build, show the exact deck tree, card type, eligible row count, errors
  and duplicates for every selected source.
- A blocking validation error disables APKG creation.
- `Status` counts may appear in validation summaries, but Status itself never
  enters the generated Anki data.

## 9. Version 1 Spreadsheet access

- The primary Version 1 workflow is direct access to a private Google Spreadsheet
  through Google OAuth for an installed/local application.
- Request read-only Sheets access. The web app must not edit source cells.
- After one-time authorization, the local Python backend accepts a normal private
  Spreadsheet URL, lists every tab and scans each tab independently.
- The user may select one, many or all valid tabs before APKG creation.
- Fetch selected ranges into one immutable in-memory snapshot before validation
  and build. The build must not read live cells incrementally.
- OAuth tokens stay outside the repository and are stored using OS-protected
  credential storage when available.
- Published-link access, XLSX upload and one/multiple CSV uploads are fallback
  inputs only. They must use the same Status/schema/deck validation core.
