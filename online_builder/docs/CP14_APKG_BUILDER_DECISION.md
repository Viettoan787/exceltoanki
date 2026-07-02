# CP14 APKG Builder Decision

Checkpoint: `CP14`
Status: accepted by user

## Decision

Start CP14 with an APKG build-plan adapter before writing a real browser APKG.

The adapter converts CP13 validation output into deterministic deck/model/note
specs. This is shared work for both candidate backends:

- `genanki-js` if it can preserve model IDs, field order, templates and note
  GUID behavior.
- `sql.js + JSZip` if lower-level control is needed.

## Why Not Build APKG Immediately

The stable Python workflow already builds APKG through `genanki`. The online
builder must not produce release claims until a generated APKG imports cleanly
into a disposable Anki profile.

The risky parts are:

- note GUID compatibility with CardUID;
- stable model IDs and field order;
- V10 template HTML/CSS/JS injection;
- collection SQLite schema compatibility;
- package zip layout and media map.

## Current CP14 Output

- `online_builder/src/apkg/constants.js`
- `online_builder/src/apkg/ids.js`
- `online_builder/src/apkg/build-plan.js`
- `online_builder/src/apkg/package-sqljs.js`
- `online_builder/scripts/build-cp14-fixture-apkg.mjs`

The current backend path is `sql.js + JSZip`, because it gives direct control
over SQLite collection data, model IDs and package contents.

The builder script is test-only:

```text
cd online_builder
npm run build:cp14-fixture
```

Expected output file:

```text
online_builder/out/cp14-fixture.apkg
```

## Tester Gate

CP14 was accepted by the user after generating and importing the test-only
APKG into Anki.

Minimum manual checks:

- import has no error dialog;
- one MCQ and one Case note appear;
- decks match the build plan;
- Browse shows exact field order;
- front/back renders without blank cards;
- `Status` is absent;
- re-import behavior is recorded.

Acceptance evidence reported by the user:

- build completed without errors;
- output contained 2 notes, 2 decks and 2 models;
- one normal MCQ and one Case note were present;
- Anki import, field order and front/back rendering were all correct;
- no `Status` field leaked into the Anki models.

CP14 is therefore complete as `v2.1.0`. This accepts the minimal APKG backend;
it does not authorize deployment or replacement of the stable Python workflow.

## References Checked

- `sql.js` supports in-memory SQLite databases and `db.export()` for a database
  byte array.
- `JSZip` supports async zip generation.
- Anki packaged decks use a zipped collection database plus media manifest.
- Reference app provided by user:
  `https://exceltoanki.github.io/t/ho-so`.

## Reference App License Notes

Screenshots of the reference app contribution/license page show these relevant
dependencies:

- app/license surface: GNU Affero General Public License v3;
- `genanki-js`: GNU Affero General Public License v3;
- `mkanki`: GNU Affero General Public License v3;
- `sql.js`: MIT;
- `JSZip`: MIT or GPLv3;
- `FileSaver.js`: MIT;
- `js-sha256`: MIT;
- `genanki`: MIT.

Rule for this project: use the reference app only for high-level architecture,
library discovery and workflow comparison. Do not copy its source code or UI
implementation into this repository unless the user explicitly accepts the
license implications.

## GitHub Repository Check

Public repositories confirmed:

- Published web build:
  `https://github.com/exceltoanki/exceltoanki.github.io`
- Browser APKG engine fork used by the author:
  `https://github.com/drquochoai/genanki-js`
- Older Python Excel-to-Anki utility:
  `https://github.com/drquochoai/Python-Excel-to-Anki-Decks-by-drquochoai`

Findings:

- The `exceltoanki.github.io` repository contains the compiled Angular/Ionic
  GitHub Pages output: minified chunks, styles, assets and third-party license
  notices. It does not expose the original Angular project structure or
  `package.json`.
- No separate public repository for the full Angular/Ionic application source
  was found under the public `drquochoai` repositories or the `exceltoanki`
  organization.
- `drquochoai/genanki-js` does contain readable source. Its package flow is:
  create a `sql.js` database, write Anki collection tables, export
  `collection.anki2`, package with `JSZip`, then download with `FileSaver.js`.
- This independently confirms the architecture already selected for CP14.
- `genanki-js` is AGPLv3. Keep this project implementation independent; do not
  copy its implementation into `online_builder/`.
