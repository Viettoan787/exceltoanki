# Local Web App Checkpoints

This document defines mandatory acceptance gates for the local PDF Anki web app.
No later checkpoint may start until every blocking item in the current checkpoint
has passed and its evidence has been saved.

## Severity and decision rules

- `BLOCKER`: can corrupt data, create duplicate notes, place notes in the wrong
  deck, break an Anki template, or make future exam results unreliable.
- `MAJOR`: core workflow is incomplete or misleading but does not corrupt data.
- `MINOR`: visual or usability defect with a valid workaround.
- A checkpoint passes only with `0 BLOCKER`, `0 MAJOR`, reproducible evidence,
  and a rollback copy.
- Tests must use copies or generated fixtures. Never test destructive operations
  against the user's main Anki collection or production Spreadsheet.

## CP0 - Freeze the data and compatibility contract

Status: `PASS FOR IMPLEMENTATION`

Purpose: decide what must remain stable before UI or API code exists.

Settled contract:

- Canonical MCQ and MCQ Case field order remains unchanged.
- `Status` is review metadata only: filter Approved when present, then remove it.
- CardUID and clickable Sheet link are embedded in `Source`; no Anki field is added.
- Sheet/tab name maps to the Anki deck path and does not identify card type.
  Google Sheet/XLSX tabs use ` > ` for hierarchy because Excel forbids `:`;
  the app maps ` > ` to Anki `::`. CSV sources use the explicit deck path.
- MCQ/Case is detected only from the remaining schema.
- V10 HTMLChem is final; MathJax/mhchem is not required.
- MCQ and Case subquestions support exactly one correct answer.
- Automatic Anki deletion is disabled in the first release.
- Detailed rules are frozen in `DATA_SOURCE_AND_DECK_RULES.md`.

Automated checks:

- Assert exact field order for both note types.
- Assert all structural selectors in `ANKI_TEMPLATE_CONTRACT.md` still exist.
- Reject malformed deck paths: empty segment, leading/trailing `::`, control
  sheet names and duplicate normalized names.

Manual acceptance:

- User approves the field schema, deck naming and formula policy in writing.

Evidence:

- Updated `SPEC.md`, `ANKI_TEMPLATE_CONTRACT.md` and a versioned schema JSON.
- Decision log listing every intentional compatibility break.
- `docs/schema_contract.v1.json` records the executable field/schema contract.

Rollback:

- Preserve V10 and `Anki_template/original_reference/` unchanged.

## CP1 - Golden fixtures and regression corpus

Status: `PASS` (fixture corpus created and visually verified on 2026-07-01)

Purpose: create small inputs whose expected output is known exactly.

Required fixtures:

- Headerless Apps Script MCQ CSV.
- Headerless Apps Script MCQ Case CSV.
- Raw Review CSV with `Status` for backward compatibility.
- Multiple files containing intentional duplicates.
- Vietnamese Unicode, quotes, commas, multiline text and empty optional fields.
- Four and five-option MCQ.
- Case containing one through five questions.
- HTML chemistry: subscript, superscript, equilibrium and reaction arrows.
- Drive thumbnail, direct image URL, existing `<img>` and invalid image input.
- Invalid answer, missing option, malformed column count and malformed deck path.
- Two sheets targeting sibling and nested decks.

Automated checks:

- Snapshot normalized rows and validation messages.
- Verify counts by type/deck and duplicate count.
- Verify deterministic GUID/CardUID behavior across repeated builds.

Evidence:

- `tests/fixtures/`, expected JSON snapshots and a generated test APKG.
- CP1 evidence is stored in `tests/fixtures/spreadsheet_cp1/`: one valid workbook,
  one intentionally invalid workbook, four CSV variants, expected manifest and
  rendered previews of every sheet. APKG generation from these fixtures belongs
  to CP2/CP4 and is not part of the CP1 fixture-authoring gate.

## CP2 - Import, normalize and validate core

Status: `PASS` (core implemented and fixture-tested on 2026-07-01)

Purpose: make one trusted Python service used by both CLI and UI.

Must support:

- CSV with and without headers, UTF-8 and UTF-8-SIG.
- Multiple CSV files in one request.
- Explicit source/deck metadata for every row.
- MCQ/Case detection by schema, not filename alone.
- Deterministic duplicate detection with a visible reason.
- No silent truncation, column shifting or coercion.
- For every CSV/Spreadsheet input: if `Status` exists, filter Approved and remove
  Status; if absent, process all non-empty rows only after showing a
  non-blocking warning that the sheet may not have been reviewed. Origin does
  not change this rule.

Pass criteria:

- Every CP1 fixture produces the expected normalized JSON.
- Invalid input cannot reach the APKG builder.
- Same input processed twice produces byte-equivalent normalized data.

Evidence:

- `scripts/import_validate_core.py`
- `tests/test_import_validate_core.py`
- `tests/fixtures/spreadsheet_cp1/cp2_valid_report.json`
- `tests/fixtures/spreadsheet_cp1/cp2_invalid_report.json`
- `tests/fixtures/spreadsheet_cp1/cp2_csv_report.json`
- `tests/fixtures/spreadsheet_cp1/cp2_duplicate_report.json`
- Verification command:

```text
python -m unittest tests.test_import_validate_core
```

## CP3 - Spreadsheet and sheet mapping

Status: `IN PROGRESS` (offline snapshot core implemented on 2026-07-01)

Purpose: map workbook tabs to Anki decks without ambiguity.

Initial scope:

- Connect one Google account with installed-app OAuth and read-only Sheets scope.
- Paste a normal private Google Spreadsheet URL, then list and scan all tabs.
- Fetch the selected tabs into one immutable snapshot before validation/build.
- Upload XLSX or selected CSV files only as fallback inputs.
- List all tabs/files before processing.
- Map exact tab name to deck path with the locked ` > ` to `::` rule.
- Ignore legacy export tabs `Anki Export` and `Anki Export Case` by default.
- Allow selecting one, many or all valid tabs.
- Detect whether each selected tab is MCQ or Case.
- Show ignored/invalid tabs and the reason.

Later scope:

- Optional published-link access for users who intentionally publish a workbook.
- Multi-user/server OAuth remains outside the local single-user release.

Pass criteria:

- Nested paths such as `0 Noi > Tim mach > MCQ` are shown as
  `0 Noi::Tim mach::MCQ` before build.
- No selected tab can be routed to another deck due to normalization.
- Duplicate deck paths are reported before build.
- If a selected source lacks `Status`, the UI must show an explicit confirmation
  before build.

Evidence so far:

- `scripts/google_sheets_snapshot.py`
- `tests/test_google_sheets_snapshot.py`
- `docs/GOOGLE_SHEETS_OAUTH_SETUP.md`
- Verification command:

```text
python -m unittest tests.test_import_validate_core tests.test_google_sheets_snapshot
```

Remaining:

- User creates/downloads OAuth Desktop client JSON.
- Run real OAuth login against a private Spreadsheet.
- Save real snapshot and validation report as CP3 evidence.

## CP4 - APKG builder integrity

Status: `PARTIAL` (CLI batch builder and V10 are working)

Purpose: prove that the package is structurally valid before opening Anki.

Automated inspection:

- ZIP opens and contains an Anki collection database.
- SQLite integrity check passes.
- Expected note, card, model and deck counts match the preview.
- Every note uses the correct V10 model.
- Model IDs, deck IDs and note GUIDs are deterministic and collision-tested.
- Field count and order match CP0.
- No old model name or test deck leaks into a production package.
- Output is written atomically: build temporary file, validate, then rename.

Pass criteria:

- Rebuilding unchanged input does not create new identities.
- A failed build leaves no partial APKG presented as successful.

## CP5 - Local backend API

Status: `IN PROGRESS` (local validation and APKG build endpoints added on 2026-07-01)

Purpose: expose the trusted core to a local-only frontend.

Endpoints/actions:

- Load files/workbook.
- List sources and candidate deck paths.
- Validate and preview counts/errors/duplicates.
- Build APKG.
- Show build report and open output folder.

Safety requirements:

- Bind to `127.0.0.1`, not all network interfaces.
- Restrict file access to chosen inputs and project output directories.
- Sanitize output names and prevent path traversal.
- Do not modify Anki collection files.
- Never log full medical question content unless debug mode is explicitly enabled.
- Store OAuth tokens outside the repository using OS-protected storage when available.
- Request read-only Sheets scope and never request write access in Version 1.
- Refresh expired access tokens automatically; require reconnect only if refresh fails.
- On network failure, never build from partial data. Retry or require explicit use
  of a timestamped cached snapshot/CSV/XLSX fallback.

Pass criteria:

- API tests cover valid, invalid, missing and oversized requests.
- Closing the launcher stops the local server cleanly.

Current implementation:

- `webapp/app.py` exposes `POST /api/validate/local`, `POST /api/validate/upload`,
  `POST /api/validate/google` and `POST /api/build`.
- XLSX mode reads workbook sheets and maps ` > ` in each sheet name to `::` in
  the complete deck path.
- CSV mode accepts one or more CSV files plus one explicit deck path.
- The endpoint reuses `scripts/import_validate_core.py` and returns the same report shape as CP2 fixtures.
- For CP5 safety, local file paths must resolve inside the project folder.
- Build APKG is enabled after a source has been validated, selected sources are
  present and validation has no blockers.
- `POST /api/build` writes APKG output atomically through the CP4 builder and
  returns a local download URL.

## CP6 - Operational web interface

Status: `IN PROGRESS` (prototype UI added on 2026-07-01)

Purpose: remove terminal use without hiding important validation information.

Required views:

- Profiles/sidebar.
- Source picker and Spreadsheet/XLSX/CSV summary.
- Dense selectable sheet table: deck path, type, rows, valid, errors, duplicates.
- Validation detail linked to source file/sheet and CardUID.
- Build confirmation showing exact deck tree and output filename.
- Build history with status and report path.

Design rules:

- Quiet operational UI inspired by Airtable/Notion references in `ai_skills`.
- No marketing landing page, decorative dashboard cards or hidden critical errors.
- Keyboard accessible, responsive and usable at Windows display scaling 100-150%.
- Destructive actions require explicit confirmation.

Pass criteria:

- User can complete the normal workflow without terminal commands.
- Build button is disabled while any blocker exists.
- UI counts exactly match backend counts.

## CP7 - Anki functional acceptance matrix

Status: `IN PROGRESS` (manual checklist created on 2026-07-01)

Purpose: verify real behavior in Anki, not only package structure.

Test matrix:

- MCQ front/back, correct and incorrect selection.
- MCQ Case with one through five questions.
- Correct green, incorrect red and explanations visible.
- Theme and font controls persist across front/back and cards.
- Vietnamese font, multiline text, images and HTMLChem render correctly.
- Desktop review, Card Preview and Edit Current behavior.
- Import into a clean test profile and re-import the same APKG.
- Verify deck hierarchy and note type names.

Deferred:

- Answer shuffling remains off until it receives its own checkpoint.

Evidence:

- Screenshots, test profile backup and signed manual checklist.
- Manual checklist template:
  `docs/CP7_ANKI_FUNCTIONAL_ACCEPTANCE.md`

## CP8 - Update, identity and migration safety

Status: `NOT STARTED`

Purpose: prevent duplicates and history loss when source data changes.

Scenarios:

- Rebuild unchanged source.
- Edit question text while keeping CardUID.
- Edit answer/explanation/image.
- Move a sheet/deck while keeping CardUID.
- Rename a deck.
- Remove or retire a source row.
- Split one Spreadsheet into multiple files.
- Merge multiple sources containing the same CardUID.

Pass criteria:

- No unintended duplicate note is created.
- Review history is preserved when an existing note is updated.
- Conflicting CardUIDs block the build with source locations shown.
- Deletion/retirement is never automatic in the first release.

## CP9 - Exam-builder compatibility

Status: `NOT STARTED`

Purpose: ensure Anki data can later become reliable exam data.

Contract requirements:

- Stable CardUID is the primary key shared by Sheet, APKG and exam records.
- Question type is explicit: MCQ or Case question index.
- Answers are machine-readable and normalized.
- Deck path, source sheet and content version are retained.
- Exam export does not parse rendered HTML to recover structured fields.
- Case questions remain grouped by their parent CaseUID/CardUID.

Tests:

- Export a deterministic exam JSON from CP1 fixtures.
- Round-trip structured data without losing answer or case grouping.
- Verify scoring for single-answer MCQ and every Case subquestion.
- Reject unsupported multi-answer questions rather than score them incorrectly.

Pass criteria:

- Exam JSON snapshots remain stable across UI-only/template-only changes.

## CP10 - Recovery, release and launcher

Status: `NOT STARTED`

Purpose: make normal use and rollback predictable.

Required release contents:

- `Open PDF Anki.bat` launcher and optional Desktop shortcut.
- Pinned Python dependencies.
- Version number displayed in UI and embedded in build report.
- Backup of the last accepted templates and configuration.
- Release notes and migration notes.
- One-click access to logs without exposing full card content by default.

Release process:

1. Run all automated tests.
2. Build golden APKG and inspect it.
3. Complete CP7 manual Anki checklist.
4. Archive the prior accepted release.
5. Publish the new release; do not overwrite the rollback copy.
6. Remove obsolete generated APKG test files only after acceptance.

## CP11 - Optional public/server deployment

Status: `DEFERRED`

This checkpoint starts only after the local app and exam contract are stable.
It covers authentication, private Sheets OAuth, upload retention, rate limits,
server isolation and privacy. GitHub Pages alone cannot run the Python backend.

## Current next action

Manually test CP5 with one real exported CSV/XLSX copied into the project
folder, then fix any UI/validation friction before connecting the APKG build
button.

CardUID re-import/update behavior remains mandatory, but it belongs to CP8 where
real Anki import/re-import behavior can be verified. Do not reopen settled rules
without explicit approval.
